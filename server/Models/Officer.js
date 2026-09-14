const mongoose = require('mongoose');

const OfficerSchema = new mongoose.Schema({
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PoliceStation',
    required: true
  },
  officerName: {
    type: String,
    required: true
  },
  badgeNumber: {
    type: String,
    required: true,
    unique: true
  },
  rank: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: false
  },
  status: {
    type: String,
    default: 'Active'
  },
  firstLogin: {
  type: Boolean,
  default: true
},
}, { timestamps: true });

module.exports = mongoose.model('Officer', OfficerSchema);
