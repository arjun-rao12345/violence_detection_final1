// const mongoose = require("mongoose");

// const policeOfficerSchema = new mongoose.Schema(
//   {
//     stationId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "PoliceStation",
//       required: true,
//     },

//     stationCode: {
//       type: String,
//       required: true,
//     },

//     officerName: {
//       type: String,
//       required: true,
//     },

//     badgeNumber: {
//       type: String,
//       required: true,
//       unique: true,
//     },

//     rank: {
//       type: String,
//       enum: [
//         "Constable",
//         "Head Constable",
//         "Sub Inspector",
//         "Inspector",
//         "DSP",
//         "ACP",
//         "DCP",
//       ],
//       required: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//     },

//     phone: {
//       type: String,
//       required: true,
//     },

//     password: {
//       type: String,
//       required: true,
//     },

//     status: {
//       type: String,
//       enum: ["Active", "Inactive"],
//       default: "Active",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("PoliceOfficer", policeOfficerSchema);