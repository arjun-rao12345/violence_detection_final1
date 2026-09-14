const mongoose = require('mongoose');

const EmergencyAlertSchema = new mongoose.Schema({
  incidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    required: true
  },
  cameraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera',
    default: null
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Critical', 'Warning', 'Info'],
    default: 'Warning'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'High'
  },
  evidenceVideo: {
    type: String,
    default: ''
  },
  evidenceImage: {
    type: String,
    default: ''
  },
  notifiedStations: {
    type: [Object],
    default: []
  },
  stationIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'PoliceStation',
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Dismissed'],
    default: 'Active'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('EmergencyAlert', EmergencyAlertSchema);
