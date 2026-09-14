const mongoose = require('mongoose');

const BackupRequestSchema = new mongoose.Schema({
  incidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    required: true
  },
  requestingOfficerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Officer',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Dispatched', 'Completed'],
    default: 'Pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('BackupRequest', BackupRequestSchema);
