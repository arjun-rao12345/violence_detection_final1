const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Weapon Detected', 'Violence', 'Aggressive Behavior', 'Theft', 'Accident', 'Suspicious Activity'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Dispatched', 'Resolved'],
    default: 'Pending'
  },
  cameraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera',
    default: null
  },
  cameraName: {
    type: String,
    default: ''
  },
  detectionType: {
    type: String,
    default: 'Violence'
  },
  confidence: {
    type: Number,
    default: 0
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'High'
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
  location: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ""
  },
  evidenceVideo: {
    type: String,
    default: ""
  },
  evidenceImage: {
    type: String,
    default: ""
  },
  assignedOfficerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Officer',
    default: null
  },
  responseStatus: {
    type: String,
    enum: ['Pending', 'Dispatched', 'On Site', 'Resolved'],
    default: 'Pending'
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Incident', IncidentSchema);
