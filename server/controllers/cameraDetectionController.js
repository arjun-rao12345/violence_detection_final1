const CameraSchema = require('../Models/Camera');
const { startDetection, stopDetection, isDetectionRunning, getRunningDetections, createIncidentAndAlert } = require('../services/violenceProcessManager');

const startCameraDetection = async (req, res) => {
  try {
    const camera = await CameraSchema.findById(req.params.cameraId).populate('policeStationId');
    if (!camera) {
      return res.status(404).json({ success: false, message: 'Camera not found' });
    }

    const result = await startDetection(camera);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({ success: true, message: result.message, data: { cameraId: result.cameraId, status: result.status } });
  } catch (error) {
    console.error('camera start error', error);
    return res.status(500).json({ success: false, message: 'Unable to start camera detection' });
  }
};

const stopCameraDetection = async (req, res) => {
  try {
    const result = await stopDetection(req.params.cameraId);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({ success: true, message: result.message, data: { cameraId: result.cameraId, status: result.status } });
  } catch (error) {
    console.error('camera stop error', error);
    return res.status(500).json({ success: false, message: 'Unable to stop camera detection' });
  }
};

const getRunningCameras = async (req, res) => {
  try {
    return res.json({ success: true, data: getRunningDetections() });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch running cameras' });
  }
};

const getCameraStatus = async (req, res) => {
  try {
    const camera = await CameraSchema.findById(req.params.cameraId);
    if (!camera) {
      return res.status(404).json({ success: false, message: 'Camera not found' });
    }

    return res.json({ success: true, data: { cameraId: camera._id, status: camera.status, running: isDetectionRunning(camera._id.toString()) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to fetch camera status' });
  }
};

const mockCameraAlert = async (req, res) => {
  try {
    const camera = await CameraSchema.findById(req.params.cameraId).populate('policeStationId');
    if (!camera) {
      return res.status(404).json({ success: false, message: 'Camera not found' });
    }

    const payload = {
      cameraId: camera._id.toString(),
      cameraName: camera.cameraName,
      detectionType: req.body.detectionType || 'Violence',
      confidence: req.body.confidence || 0.96,
      imagePath: 'uploads/evidence/mock_image.jpg',
      videoPath: 'uploads/evidence/mock_video.mp4',
      timestamp: new Date().toISOString()
    };

    const result = await createIncidentAndAlert(payload, camera);
    return res.json({ success: true, message: 'Mock alert generated successfully', result });
  } catch (error) {
    console.error('mock alert error', error);
    return res.status(500).json({ success: false, message: 'Unable to generate mock alert', error: error.message });
  }
};

module.exports = {
  startCameraDetection,
  stopCameraDetection,
  getRunningCameras,
  getCameraStatus,
  mockCameraAlert
};
