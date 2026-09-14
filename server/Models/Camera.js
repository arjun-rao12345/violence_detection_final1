const mongoose = require('mongoose');

const CameraSchema = new mongoose.Schema({
  cameraName: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  streamUrl: {
    type: String,
    default: ""
  },
  ipAddress: {
    type: String,
    default: ""
  },
  policeStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoliceStation',
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance', 'Error'],
    default: 'Active'
  },
  resolution: {
    type: String,
    default: "1080p"
  },
  nightVision: {
    type: Boolean,
    default: true
  },
  alertsCount: {
    type: Number,
    default: 0
  },
  lastThreatDetected: {
    type: Date,
    default: null
  },
  lastDetectionType: {
    type: String,
    default: ''
  },
  lastEvidenceVideo: {
    type: String,
    default: ''
  },
  lastEvidenceImage: {
    type: String,
    default: ''
  },
  lastDetectionConfidence: {
    type: Number,
    default: 0
  },
  lastDetectionTime: {
    type: Date,
    default: null
  },
  lastError: {
    type: String,
    default: ''
  },
  detectionStatus: {
    type: String,
    default: 'Idle'
  }
}, { timestamps: true });

module.exports = mongoose.model('Camera', CameraSchema);
