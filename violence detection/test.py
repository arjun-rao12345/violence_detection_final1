"""
Real-time violence detection from a laptop webcam or another video source using the
fine-tuned MobileNetV2 + LSTM model.

This script is designed to be launched by the Express backend through a child process.
It uses only the trained mobilenet_lstm_violence_best.keras model.
"""

import argparse
import json
import os
import signal
import sys
import time
from collections import deque
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
import tensorflow as tf

RESOLUTION = 160
NUM_FRAMES = 20
CLASS_NAMES = ["Normal", "Violence", "Weaponized"]
DANGER_LABELS = {"Violence", "Weaponized"}

FRAME_BUFFER = deque(maxlen=NUM_FRAMES)
VIDEO_BUFFER = deque()
CURRENT_LABEL = None
CURRENT_CONFIDENCE = 0.0
DANGER_START_TIME = None
EVENT_RECORDED = False
LAST_CONFIRMATION_TIME = 0.0
EVIDENCE_DIR = None
SESSION_VIDEO_WRITER = None
SESSION_VIDEO_PATH = None
CAP = None
MODEL = None


def format_frame(frame_bgr, output_size=(RESOLUTION, RESOLUTION)):
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    frame = tf.image.convert_image_dtype(frame_rgb, tf.float32)
    frame = tf.image.resize_with_pad(frame, *output_size)
    return frame.numpy()


def parse_source(source_value):
    if source_value is None:
        return 0

    value = str(source_value).strip()
    if not value:
        return 0

    if value.isdigit():
        return int(value)

    return value


def ensure_evidence_dir(camera_id):
    global EVIDENCE_DIR
    base_dir = Path(__file__).resolve().parent / ".." / "server" / "uploads" / "evidence" / str(camera_id)
    base_dir.mkdir(parents=True, exist_ok=True)
    EVIDENCE_DIR = base_dir
    return base_dir


def write_evidence_image(camera_id, frame_bgr):
    global EVIDENCE_DIR
    if EVIDENCE_DIR is None:
        ensure_evidence_dir(camera_id)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    image_path = EVIDENCE_DIR / f"{camera_id}_{timestamp}_image.jpg"
    cv2.imwrite(str(image_path), frame_bgr)
    return str(image_path)


def prepare_session_video(camera_id, frame_shape):
    global SESSION_VIDEO_WRITER, SESSION_VIDEO_PATH, EVIDENCE_DIR
    if EVIDENCE_DIR is None:
        ensure_evidence_dir(camera_id)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    SESSION_VIDEO_PATH = str(EVIDENCE_DIR / f"{camera_id}_{timestamp}_session.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    SESSION_VIDEO_WRITER = cv2.VideoWriter(SESSION_VIDEO_PATH, fourcc, 10.0, (frame_shape[1], frame_shape[0]))
    if not SESSION_VIDEO_WRITER.isOpened():
        emit('error', {'cameraId': camera_id, 'message': 'Unable to open session video writer'})
        SESSION_VIDEO_WRITER = None


def write_session_frame(frame_bgr):
    global SESSION_VIDEO_WRITER
    if SESSION_VIDEO_WRITER is not None and SESSION_VIDEO_WRITER.isOpened():
        SESSION_VIDEO_WRITER.write(frame_bgr)


def write_evidence_video(camera_id, buffered_items, frame_shape):
    global EVIDENCE_DIR
    if EVIDENCE_DIR is None:
        ensure_evidence_dir(camera_id)

    if not buffered_items:
        return ""

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    video_path = str(EVIDENCE_DIR / f"{camera_id}_{timestamp}_evidence.mp4")

    # Extract timestamps and frames if stored as (timestamp, frame)
    if isinstance(buffered_items[0], (tuple, list)):
        timestamps = [item[0] for item in buffered_items]
        frames = [item[1] for item in buffered_items]
        total_time = timestamps[-1] - timestamps[0]
    else:
        frames = buffered_items
        total_time = 0.0

    num_frames = len(frames)
    if num_frames == 0:
        return ""

    # Calculate actual FPS so video playback speed matches real-world time (1.0x normal speed)
    if total_time > 0.1:
        computed_fps = num_frames / total_time
        target_fps = round(max(5.0, min(30.0, computed_fps)), 1)
    else:
        target_fps = 10.0

    writer = None
    for codec in ['mp4v', 'avc1', 'H264', 'XVID']:
        try:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            w = cv2.VideoWriter(video_path, fourcc, target_fps, (frame_shape[1], frame_shape[0]))
            if w.isOpened():
                writer = w
                break
        except Exception:
            pass

    if writer is not None and writer.isOpened():
        for frame in frames:
            writer.write(frame)
        writer.release()
        return video_path
    return ""


def write_live_preview(camera_id, frame_bgr):
    live_dir = Path(__file__).resolve().parent.parent / 'server' / 'uploads' / 'live' / str(camera_id)
    live_dir.mkdir(parents=True, exist_ok=True)
    preview_path = live_dir / 'current.jpg'
    cv2.imwrite(str(preview_path), frame_bgr)
    return str(preview_path)


def emit(event_type, payload):
    payload = dict(payload)
    payload['type'] = event_type
    print(json.dumps(payload), flush=True)


def shutdown_handler(signum, frame):
    cleanup()
    sys.exit(0)


def cleanup():
    global CAP, SESSION_VIDEO_WRITER
    if CAP is not None:
        CAP.release()
    if SESSION_VIDEO_WRITER is not None and SESSION_VIDEO_WRITER.isOpened():
        SESSION_VIDEO_WRITER.release()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--camera-id', default='manual')
    parser.add_argument('--source', default='0')
    parser.add_argument('--camera-name', default='Camera')
    parser.add_argument('--threshold', type=float, default=0.80)
    parser.add_argument('--consecutive-count', type=int, default=3)
    parser.add_argument('--record-duration', type=float, default=5.0)
    parser.add_argument('--confirm-duration', type=float, default=0.6)
    parser.add_argument('--cooldown-seconds', type=int, default=30)
    parser.add_argument('--server-url', default='http://localhost:4001')
    parser.add_argument('--display', action='store_true')
    parser.add_argument('--model', default='mobilenet_lstm_violence_best.keras')
    args = parser.parse_args()

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    emit('status', {'cameraId': args.camera_id, 'status': 'started'})

    model_path = args.model
    if not os.path.isabs(model_path):
        model_path = os.path.abspath(model_path)
    if not os.path.exists(model_path):
        emit('error', {'cameraId': args.camera_id, 'message': f'Model file not found at {model_path}'})
        return

    try:
        global MODEL
        MODEL = tf.keras.models.load_model(model_path)
    except Exception as exc:
        emit('error', {'cameraId': args.camera_id, 'message': f'Unable to load model: {exc}'})
        return

    source = parse_source(args.source)
    global CAP, VIDEO_BUFFER, DANGER_START_TIME, EVENT_RECORDED, LAST_CONFIRMATION_TIME, CURRENT_LABEL, CURRENT_CONFIDENCE
    DANGER_START_TIME = None
    EVENT_RECORDED = False
    LAST_CONFIRMATION_TIME = 0.0
    CURRENT_LABEL = None
    CURRENT_CONFIDENCE = 0.0
    CAP = cv2.VideoCapture(source)
    if not CAP.isOpened():
        emit('error', {'cameraId': args.camera_id, 'message': 'Unable to open camera source'})
        return

    # Keep a time-based rolling buffer for the requested record duration
    max_frames_cap = int(max(150, 40 * max(args.record_duration, 5.0)))
    VIDEO_BUFFER = deque(maxlen=max_frames_cap)

    frame_counter = 0

    while True:
        try:
            ret, frame_bgr = CAP.read()
            if not ret:
                emit('error', {'cameraId': args.camera_id, 'message': 'Camera feed ended'})
                break

            now = time.time()
            frame_counter += 1
            FRAME_BUFFER.append(format_frame(frame_bgr))
            VIDEO_BUFFER.append((now, frame_bgr.copy()))

            # Trim frames older than record-duration so evidence video is normal duration
            cutoff_time = now - max(args.record_duration, 4.0)
            while VIDEO_BUFFER and VIDEO_BUFFER[0][0] < cutoff_time:
                VIDEO_BUFFER.popleft()

            if SESSION_VIDEO_WRITER is None:
                prepare_session_video(args.camera_id, frame_bgr.shape)
            write_session_frame(frame_bgr)

            if frame_counter % 5 == 0:
                preview_path = write_live_preview(args.camera_id, frame_bgr)
                emit('preview', {
                    'cameraId': args.camera_id,
                    'cameraName': args.camera_name,
                    'imagePath': preview_path,
                    'timestamp': datetime.now().isoformat()
                })

            if len(FRAME_BUFFER) == NUM_FRAMES:
                clip = np.expand_dims(np.array(FRAME_BUFFER), axis=0)
                probs = MODEL.predict(clip, verbose=0)[0]
                pred_id = int(np.argmax(probs))
                label = CLASS_NAMES[pred_id]
                confidence = float(probs[pred_id])
                CURRENT_LABEL = label
                CURRENT_CONFIDENCE = confidence

                now = time.time()
                if label in DANGER_LABELS and confidence >= args.threshold:
                    if DANGER_START_TIME is None:
                        DANGER_START_TIME = now

                    confirm_window = getattr(args, 'confirm_duration', 0.6)
                    if (
                        not EVENT_RECORDED
                        and (now - DANGER_START_TIME) >= confirm_window
                        and (now - LAST_CONFIRMATION_TIME) >= args.cooldown_seconds
                    ):
                        image_path = write_evidence_image(args.camera_id, frame_bgr)
                        video_path = write_evidence_video(args.camera_id, list(VIDEO_BUFFER), frame_bgr.shape)
                        emit('violence_confirmed', {
                            'cameraId': args.camera_id,
                            'cameraName': args.camera_name,
                            'detectionType': label,
                            'confidence': confidence,
                            'imagePath': image_path,
                            'videoPath': video_path,
                            'timestamp': datetime.now().isoformat()
                        })
                        emit('evidence', {'cameraId': args.camera_id, 'imagePath': image_path, 'videoPath': video_path})
                        EVENT_RECORDED = True
                        LAST_CONFIRMATION_TIME = now
                else:
                    DANGER_START_TIME = None
                    EVENT_RECORDED = False

                emit('prediction', {
                    'cameraId': args.camera_id,
                    'cameraName': args.camera_name,
                    'label': label,
                    'confidence': confidence,
                    'timestamp': datetime.now().isoformat()
                })

            if args.display:
                display = frame_bgr.copy()
                overlay_text = f"{CURRENT_LABEL or 'Collecting frames'} ({CURRENT_CONFIDENCE * 100:.1f}%)"
                cv2.putText(display, overlay_text, (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                cv2.imshow('Violence Detection', display)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

            time.sleep(0.03)
        except KeyboardInterrupt:
            break
        except Exception as exc:
            emit('error', {'cameraId': args.camera_id, 'message': str(exc)})
            break

    cleanup()


if __name__ == '__main__':
    main()