const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const CameraSchema = require('../Models/Camera');
const IncidentSchema = require('../Models/Incident');
const EmergencyAlertSchema = require('../Models/EmergencyAlert');
const OfficerSchema = require('../Models/Officer');
const PoliceStation = require('../Models/policeStation');
const { sendIncidentAlertEmail } = require('../utils/sendMail');

const activeProcesses = new Map();
const cooldowns = new Map();

const projectRoot = path.resolve(__dirname, '..', '..');

function resolveConfiguredPath(value) {
  if (!value) {
    return null;
  }

  if (path.isAbsolute(value)) {
    return value;
  }

  return path.resolve(projectRoot, value);
}

function sanitizeMessage(message) {
  if (typeof message !== 'string') {
    return '';
  }

  return message.replace(/\r?\n/g, ' ').trim();
}

function parseNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

async function findNearestRegisteredStation(latitude, longitude) {
  const cameraLat = parseNumber(latitude);
  const cameraLon = parseNumber(longitude);
  if (cameraLat === null || cameraLon === null) {
    return null;
  }

  const stations = await PoliceStation.find({
    email: { $exists: true, $ne: '' },
    status: 'Active'
  }).lean();

  let bestStation = null;
  let bestDistance = Infinity;

  for (const station of stations) {
    const stationLat = parseNumber(station.latitude);
    const stationLon = parseNumber(station.longitude);
    if (stationLat === null || stationLon === null) {
      continue;
    }

    const distance = getDistanceKm(cameraLat, cameraLon, stationLat, stationLon);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestStation = station;
    }
  }

  return bestStation;
}

async function getActiveStationRecipients() {
  const stations = await PoliceStation.find({ status: 'Active' }).lean();
  if (!stations || !stations.length) {
    return [];
  }

  const stationIds = stations.map((station) => station._id);
  const officers = await OfficerSchema.find({
    stationId: { $in: stationIds },
    status: { $in: ['Active', 'On Duty'] }
  }).lean();

  return stations.map((station) => {
    const stationOfficers = officers
      .filter((officer) => officer.stationId?.toString() === station._id.toString())
      .map((officer) => ({
        officerId: officer._id,
        officerName: officer.officerName,
        email: officer.email,
        phone: officer.phone,
        rank: officer.rank
      }));

    return {
      stationId: station._id,
      stationName: station.stationName,
      inchargeName: station.inchargeName,
      email: station.email || null,
      contactNumber: station.contactNumber || null,
      address: station.address || null,
      city: station.city || null,
      state: station.state || null,
      officers: stationOfficers
    };
  });
}

async function getAssignedStationRecipients(camera) {
  const stationId = camera?.policeStationId?._id?.toString?.() || camera?.policeStationId?.toString?.();
  if (!stationId) {
    return getActiveStationRecipients();
  }

  const station = await PoliceStation.findOne({ _id: stationId, status: 'Active' }).lean();
  if (!station) {
    return getActiveStationRecipients();
  }

  const officers = await OfficerSchema.find({
    stationId: station._id,
    status: { $in: ['Active', 'On Duty'] }
  }).lean();

  const stationOfficers = officers.map((officer) => ({
    officerId: officer._id,
    officerName: officer.officerName,
    email: officer.email,
    phone: officer.phone,
    rank: officer.rank
  }));

  if (stationOfficers.length || station.email) {
    return [
      {
        stationId: station._id,
        stationName: station.stationName,
        inchargeName: station.inchargeName,
        email: station.email || null,
        contactNumber: station.contactNumber || null,
        address: station.address || null,
        city: station.city || null,
        state: station.state || null,
        officers: stationOfficers
      }
    ];
  }

  return getActiveStationRecipients();
}

function buildUploadUrl(filePath) {
  if (!filePath) {
    return null;
  }

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const uploadsRoot = path.resolve(projectRoot, 'server', 'uploads');
  const relative = path.relative(uploadsRoot, filePath);
  if (!relative || relative.startsWith('..')) {
    return null;
  }

  const port = process.env.PORT || 4001;
  let serverUrl = (process.env.SERVER_URL || '').trim();
  if (!serverUrl || serverUrl.includes('localhost') || serverUrl.includes('127.0.0.1')) {
    let lanIp = 'localhost';
    try {
      const os = require('os');
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            lanIp = iface.address;
            break;
          }
        }
        if (lanIp !== 'localhost') break;
      }
    } catch (e) {}
    serverUrl = `http://${lanIp}:${port}`;
  }

  // If serverUrl doesn't specify port and isn't using standard 80/443, append default server port
  if (serverUrl && !serverUrl.match(/:\d+$/)) {
    serverUrl = `${serverUrl}:${port}`;
  }

  return `${serverUrl}/upload/${relative.split(path.sep).join('/')}`;
}

async function createIncidentAndAlert(payload, camera) {
  const cameraId = payload.cameraId || camera?._id?.toString();
  const now = new Date();
  const cooldownKey = `${cameraId}:${payload.timestamp || now.toISOString()}`;
  const lastCooldown = cooldowns.get(cameraId);
  const cooldownSeconds = Number(process.env.VIOLENCE_ALERT_COOLDOWN_SECONDS || 30);

  if (lastCooldown && (now.getTime() - lastCooldown) < cooldownSeconds * 1000) {
    return null;
  }

  cooldowns.set(cameraId, now.getTime());

  const evidenceImageUrl = buildUploadUrl(payload.imagePath);
  const evidenceVideoUrl = buildUploadUrl(payload.videoPath);

  const rawDetectionType = payload.detectionType || payload.label || 'Violence';
  const incidentType = rawDetectionType === 'Weaponized' ? 'Weapon Detected' : rawDetectionType;
  const incidentData = {
    type: incidentType,
    status: 'Pending',
    cameraId: cameraId || null,
    cameraName: camera?.cameraName || 'Camera',
    detectionType: rawDetectionType,
    confidence: payload.confidence || 0,
    latitude: (camera?.latitude !== undefined && camera?.latitude !== null) ? Number(camera.latitude) : 0.0,
    longitude: (camera?.longitude !== undefined && camera?.longitude !== null) ? Number(camera.longitude) : 0.0,
    address: camera?.address || 'Unknown Location',
    location: camera?.address || 'Unknown Location',
    description: `${rawDetectionType} detected${camera?.cameraName ? ` at ${camera.cameraName}` : ''} with confidence ${Number(payload.confidence || 0).toFixed(2)}`,
    evidenceVideo: evidenceVideoUrl || '',
    evidenceImage: evidenceImageUrl || '',
    timestamp: now
  };

  const incident = await IncidentSchema.create(incidentData);

  // Find nearest active police station based on camera coordinates
  const nearestStation = await findNearestRegisteredStation(incidentData.latitude, incidentData.longitude);

  let activeStation = nearestStation;
  if (!activeStation) {
    const assignedId = camera?.policeStationId?._id || camera?.policeStationId;
    if (assignedId) {
      activeStation = await PoliceStation.findById(assignedId).lean();
    }
  }

  // Fallback: if no nearest station is found and no station was assigned to the camera,
  // use the first active station in the database so the email alert is always sent.
  if (!activeStation) {
    activeStation = await PoliceStation.findOne({ status: 'Active' }).lean();
  }

  let stationOfficers = [];
  if (activeStation) {
    stationOfficers = await OfficerSchema.find({
      stationId: activeStation._id,
      status: { $in: ['Active', 'On Duty'] }
    }).lean();
  }

  const stationIds = [];
  const notifiedStations = [];

  if (activeStation) {
    stationIds.push(activeStation._id);
    notifiedStations.push({
      stationId: activeStation._id,
      stationName: activeStation.stationName,
      inchargeName: activeStation.inchargeName,
      email: activeStation.email,
      officers: stationOfficers.map(o => ({
        officerId: o._id,
        officerName: o.officerName,
        email: o.email,
        phone: o.phone,
        rank: o.rank
      }))
    });
  }

  const alert = await EmergencyAlertSchema.create({
    incidentId: incident._id,
    cameraId: cameraId || null,
    message: camera?.cameraName
      ? `Violence detected by ${camera.cameraName}`
      : 'Violence detected',
    severity: 'Critical',
    priority: 'High',
    status: 'Active',
    evidenceVideo: evidenceVideoUrl || '',
    evidenceImage: evidenceImageUrl || '',
    notifiedStations,
    stationIds
  });

  await CameraSchema.findByIdAndUpdate(cameraId, {
    $inc: { alertsCount: 1 },
    lastThreatDetected: now,
    lastDetectionType: rawDetectionType,
    lastDetectionConfidence: payload.confidence || 0,
    lastDetectionTime: now,
    lastEvidenceVideo: evidenceVideoUrl || '',
    lastEvidenceImage: evidenceImageUrl || '',
    status: 'Active'
  }).catch((err) => console.error('Failed to update camera details:', err));

  const recipientList = [];
  const seenEmails = new Set();

  if (activeStation) {
    // Add station email
    if (activeStation.email) {
      const emailLower = activeStation.email.toLowerCase();
      seenEmails.add(emailLower);
      recipientList.push({
        email: activeStation.email,
        name: activeStation.inchargeName || activeStation.stationName || 'Police Station',
        stationName: activeStation.stationName
      });
    }

    // Add officers of this nearest/active station
    stationOfficers.forEach((officer) => {
      if (officer.email) {
        const emailLower = officer.email.toLowerCase();
        if (!seenEmails.has(emailLower)) {
          seenEmails.add(emailLower);
          recipientList.push({
            email: officer.email,
            name: officer.officerName,
            stationName: activeStation.stationName
          });
        }
      }
    });
  }

  if (recipientList.length) {
    for (const recipient of recipientList) {
      sendIncidentAlertEmail(
        recipient.email,
        recipient.name,
        alert.message,
        camera?.cameraName || '',
        camera?.address || '',
        evidenceVideoUrl,
        evidenceImageUrl,
        {
          detectionType: incidentData.detectionType,
          confidence: incidentData.confidence,
          timestamp: incidentData.timestamp.toISOString()
        },
        recipient.stationName,
        payload.imagePath,
        payload.videoPath
      ).then(() => {
        const io = global.io;
        if (io) {
          io.emit('email:sent', {
            email: recipient.email,
            name: recipient.name,
            stationName: recipient.stationName || 'Police Station',
            cameraName: camera?.cameraName || '',
            timestamp: new Date().toISOString()
          });
        }
      }).catch((error) => {
        console.error('Failed to send incident alert email to', recipient.email, error);
      });
    }
  } else {
    console.warn(`No active police station recipients found for camera ${cameraId}`);
  }

  const alertRecipient = notifiedStations.length ? notifiedStations[0] : null;
  const io = global.io;
  if (io) {
    io.emit('violence:detected', {
      cameraId,
      cameraName: camera?.cameraName,
      confidence: payload.confidence,
      incidentId: incident._id,
      alertId: alert._id,
      timestamp: now.toISOString(),
      alertRecipients: notifiedStations
    });
    io.emit('incident:created', {
      incident,
      camera,
      alertRecipients: notifiedStations,
      timestamp: now.toISOString()
    });
    io.emit('alert:created', {
      alert,
      incident,
      alertRecipients: notifiedStations,
      timestamp: now.toISOString()
    });
    io.emit('evidence:created', {
      cameraId,
      imagePath: payload.imagePath,
      videoPath: payload.videoPath,
      timestamp: now.toISOString()
    });
  }

  return { incident, alert };
}

async function finishProcess(entry, reason, payload = {}) {
  if (!entry) {
    return;
  }

  if (entry.process && !entry.process.killed) {
    try {
      entry.process.kill();
    } catch (error) {
      // ignore
    }
  }

  if (entry.cameraId) {
    activeProcesses.delete(entry.cameraId);
  }

  if (entry.cameraId) {
    await CameraSchema.findByIdAndUpdate(entry.cameraId, {
      status: reason === 'stopped' ? 'Inactive' : 'Error'
    }).catch(() => {});
  }

  const io = global.io;
  if (io && entry.cameraId) {
    const eventName = reason === 'stopped' ? 'camera:stopped' : 'camera:error';
    io.emit(eventName, {
      cameraId: entry.cameraId,
      cameraName: entry.cameraName,
      message: payload.message || (reason === 'stopped' ? 'Camera stopped' : 'Camera detection stopped unexpectedly'),
      timestamp: new Date().toISOString()
    });
  }
}

async function startDetection(camera) {
  if (!camera) {
    return { success: false, message: 'Camera not found' };
  }

  const cameraId = camera._id?.toString?.() || camera.id;
  if (!cameraId) {
    return { success: false, message: 'Invalid camera id' };
  }

  if (activeProcesses.has(cameraId)) {
    return { success: false, message: 'Camera detection is already running', alreadyRunning: true };
  }

  const pythonPath = resolveConfiguredPath(process.env.VIOLENCE_PYTHON_PATH || 'violence detection/violence-env/Scripts/python.exe');
  const scriptPath = resolveConfiguredPath(process.env.VIOLENCE_SCRIPT_PATH || 'violence detection/test.py');
  const modelPath = resolveConfiguredPath(process.env.VIOLENCE_MODEL_PATH || 'violence detection/mobilenet_lstm_violence_best.keras');

  if (!pythonPath || !scriptPath || !modelPath) { 
    return { success: false, message: 'Violence detection configuration is incomplete' };
  }

  if (!fs.existsSync(pythonPath)) {
    return { success: false, message: `Python environment is not available at ${pythonPath}` };
  }

  if (!fs.existsSync(scriptPath)) {
    return { success: false, message: `Violence detection script was not found at ${scriptPath}` };
  }

  if (!fs.existsSync(modelPath)) {
    return { success: false, message: `Violence detection model was not found at ${modelPath}` };
  }

  const sourceValue = camera.streamUrl && camera.streamUrl.trim() ? camera.streamUrl : (camera.ipAddress || '0');
  const args = [
    scriptPath,
    '--camera-id', cameraId,
    '--source', sourceValue,
    '--camera-name', camera.cameraName || 'Camera',
    '--threshold', process.env.VIOLENCE_THRESHOLD || '0.80',
    '--consecutive-count', process.env.VIOLENCE_CONSECUTIVE_COUNT || '3',
    '--cooldown-seconds', process.env.VIOLENCE_ALERT_COOLDOWN_SECONDS || '30',
    '--record-duration', process.env.VIOLENCE_RECORD_DURATION || '5.0',
    '--confirm-duration', process.env.VIOLENCE_CONFIRM_SECONDS || '0.6',
    '--model', modelPath,
    '--server-url', process.env.SERVER_URL || 'http://localhost:4001'
  ];

  const child = spawn(pythonPath, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const entry = {
    cameraId,
    cameraName: camera.cameraName || 'Camera',
    process: child,
    source: sourceValue,
    stopped: false
  };

  activeProcesses.set(cameraId, entry);

  await CameraSchema.findByIdAndUpdate(cameraId, {
    status: 'Active' 
  }).catch(() => {});

  let stdoutBuffer = '';
  child.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() || '';

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.type === 'status') {
          const io = global.io;
          if (io) {
            io.emit('camera:started', {
              cameraId,
              cameraName: camera.cameraName || 'Camera',
              status: parsed.status || 'started',
              timestamp: new Date().toISOString()
            });
          }
          return;
        }

        if (parsed.type === 'prediction') {
          const io = global.io;
          if (io) {
            io.emit('detection:prediction', {
              cameraId,
              cameraName: camera.cameraName || 'Camera',
              label: parsed.label,
              confidence: parsed.confidence,
              timestamp: parsed.timestamp || new Date().toISOString()
            });
          }
          return;
        }

        if (parsed.type === 'violence_confirmed') {
          createIncidentAndAlert(parsed, camera).catch((err) => {
            console.error('Error in createIncidentAndAlert:', err);
          });
          return;
        }

        if (parsed.type === 'preview') {
          const io = global.io;
          if (io) {
            io.emit('camera:preview', {
              cameraId,
              cameraName: camera.cameraName || 'Camera',
              imageUrl: buildUploadUrl(parsed.imagePath),
              timestamp: parsed.timestamp || new Date().toISOString()
            });
          }
          return;
        }

        if (parsed.type === 'evidence') {
          const io = global.io;
          if (io) {
            io.emit('evidence:created', {
              cameraId,
              imagePath: parsed.imagePath,
              videoPath: parsed.videoPath,
              timestamp: new Date().toISOString()
            });
          }
          return;
        }

        if (parsed.type === 'error') {
          const io = global.io;
          if (io) {
            io.emit('camera:error', {
              cameraId,
              cameraName: camera.cameraName || 'Camera',
              message: sanitizeMessage(parsed.message || 'Detection error'),
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        const io = global.io;
        if (io) {
          io.emit('camera:error', {
            cameraId,
            cameraName: camera.cameraName || 'Camera',
            message: 'Invalid JSON received from detection process',
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });

  child.stderr.on('data', (chunk) => {
    const message = chunk.toString();
    console.error(`[violence-detection:${cameraId}] ${message}`);
  });

  child.on('error', async () => {
    await finishProcess(entry, 'error', { message: 'Unable to start detection process' });
  });

  child.on('exit', async (code) => {
    if (entry.stopped) {
      return;
    }

    await finishProcess(entry, 'error', {
      message: code === 0 ? 'Detection process exited cleanly' : `Detection process exited with code ${code}`
    });
  });

  return {
    success: true,
    message: 'Camera and violence detection started successfully',
    cameraId,
    status: 'Active'
  };
}

async function stopDetection(cameraId) {
  const entry = activeProcesses.get(cameraId);
  if (!entry) {
    return { success: false, message: 'Camera detection is not running' };
  }

  entry.stopped = true;
  if (entry.process && !entry.process.killed) {
    entry.process.kill();
  }

  activeProcesses.delete(cameraId);
  await CameraSchema.findByIdAndUpdate(cameraId, { status: 'Inactive' }).catch(() => {});

  const io = global.io;
  if (io) {
    io.emit('camera:stopped', {
      cameraId,
      cameraName: entry.cameraName,
      message: 'Camera detection stopped',
      timestamp: new Date().toISOString()
    });
  }

  return {
    success: true,
    message: 'Camera detection stopped successfully',
    cameraId,
    status: 'Inactive'
  };
}

function isDetectionRunning(cameraId) {
  return activeProcesses.has(cameraId);
}

async function stopAllDetections() {
  const promises = [];
  for (const [cameraId, entry] of activeProcesses) {
    entry.stopped = true;
    if (entry.process && !entry.process.killed) {
      entry.process.kill();
    }
    promises.push(CameraSchema.findByIdAndUpdate(cameraId, { status: 'Inactive' }).catch(() => {}));
  }

  activeProcesses.clear();
  await Promise.all(promises);
  return true;
}

function getRunningDetections() {
  return Array.from(activeProcesses.entries()).map(([cameraId, entry]) => ({
    cameraId,
    cameraName: entry.cameraName,
    source: entry.source
  }));
}

module.exports = {
  startDetection,
  stopDetection,
  isDetectionRunning,
  stopAllDetections,
  getRunningDetections,
  createIncidentAndAlert
};
