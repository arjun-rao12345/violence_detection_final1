const mongoose = require("mongoose");

const ViolenceReportSchema = new mongoose.Schema(
  {
    incidentNumber: {
      type: String,
      required: true,
      unique: true
    },

    // Logged-in user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    category: {
      type: String,
      enum: [
        "Physical Assault",
        "Weapon Threat",
        "Fight / Brawl",
        "Robbery / Mugging",
        "Domestic Violence",
        "Vandalism / Riot",
        "Stalking / Harassment",
        "Suspicious Activity",
        "SOS Emergency",
        "Other Threat"
      ],
      required: true
    },

    severity: {
      type: String,
      enum: ["low", "med", "high", "urgent"],
      default: "high"
    },

    location: {
      type: String,
      required: true
    },

    latitude: {
      type: Number,
      default: null
    },

    longitude: {
      type: Number,
      default: null
    },


// NEW
assignedOfficerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Officer",
  default: null
},

    policeStationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PoliceStation",
      default: null
    },

    distanceFromStation: {
      type: Number,
      default: null
    },

    description: {
      type: String,
      required: true
    },

    images: {
      type: [String],
      default: []
    },

    isAnonymous: {
      type: Boolean,
      default: false
    },

    isInjured: {
      type: Boolean,
      default: false
    },

   status: {
  type: String,
  enum: [
    "Pending",
    "Assigned",
    "Under Review",
    "Dispatched",
    "Resolved",
    // "Rejected"
  ],
  default: "Pending"
}
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.model(
    "ViolenceReport",
    ViolenceReportSchema
  );