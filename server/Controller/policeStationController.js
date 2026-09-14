const PoliceStation = require('../Models/policeStation');

const Officer = require('../Models/Officer');
const { sendSupportRequestEmail } = require('../utils/sendMail');

const addPoliceStation = async (req, res) => {
  try {
    const station = new PoliceStation(req.body);
    const savedStation = await station.save();

    res.status(201).json({
      success: true,
      message: 'Police station added successfully',
      data: savedStation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add police station',
      error: error.message,
    });
  }
};

const getPoliceStations = async (req, res) => {
  try {
    const stations = await PoliceStation.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: stations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch police stations',
      error: error.message,
    });
  }
};

const getPoliceStationById = async (req, res) => {
  try {
    const station = await PoliceStation.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Police station not found',
      });
    }

    res.status(200).json({
      success: true,
      data: station,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch police station',
      error: error.message,
    });
  }
};

const updatePoliceStation = async (req, res) => {
  try {
    const updatedStation = await PoliceStation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedStation) {
      return res.status(404).json({
        success: false,
        message: 'Police station not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Police station updated successfully',
      data: updatedStation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update police station',
      error: error.message,
    });
  }
};

const deletePoliceStation = async (req, res) => {
  try {
    const deletedStation = await PoliceStation.findByIdAndDelete(req.params.id);

    if (!deletedStation) {
      return res.status(404).json({
        success: false,
        message: 'Police station not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Police station deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete police station',
      error: error.message,
    });
  }
};

const requestSupport = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { fromOfficerName, fromStationName } = req.body;

    const targetStation = await PoliceStation.findById(stationId);
    if (!targetStation) {
      return res.status(404).json({ success: false, message: 'Target police station not found' });
    }

    const targetOfficers = await Officer.find({
      stationId: targetStation._id,
      status: { $in: ['Active', 'On Duty'] }
    });

    const recipientEmails = new Set();
    const recipientList = [];

    if (targetStation.email) {
      recipientEmails.add(targetStation.email.toLowerCase());
      recipientList.push({
        email: targetStation.email,
        name: targetStation.inchargeName || targetStation.stationName || 'Police Station'
      });
    }

    targetOfficers.forEach((officer) => {
      if (officer.email) {
        const emailLower = officer.email.toLowerCase();
        if (!recipientEmails.has(emailLower)) {
          recipientEmails.add(emailLower);
          recipientList.push({
            email: officer.email,
            name: officer.officerName
          });
        }
      }
    });

    // Try to auto-detect sender using JWT token
    const token = req.header("auth-token");
    const jwt = require("jsonwebtoken");
    let senderName = fromOfficerName || 'An Officer';
    let senderStation = fromStationName || 'Another Station';

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SECRETE_KEY || "AUTHKEY");
        if (decoded && decoded.officerId) {
          const senderObj = await Officer.findById(decoded.officerId).populate('stationId');
          if (senderObj) {
            senderName = senderObj.officerName;
            if (senderObj.stationId) {
              senderStation = senderObj.stationId.stationName;
            }
          }
        }
      } catch (err) {
        // ignore
      }
    }

    for (const recipient of recipientList) {
      sendSupportRequestEmail(
        recipient.email,
        recipient.name,
        senderName,
        senderStation
      ).catch((err) => {
        console.error('Failed to send support email:', err);
      });
    }

    const io = global.io;
    if (io) {
      io.emit('support:requested', {
        targetStationId: targetStation._id,
        targetStationName: targetStation.stationName,
        fromOfficerName: senderName,
        fromStationName: senderStation,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Emergency backup request sent successfully to ${recipientList.length} officers under ${targetStation.stationName}.`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error requesting support' });
  }
};

module.exports = {
  addPoliceStation,
  getPoliceStations,
  getPoliceStationById,
  updatePoliceStation,
  deletePoliceStation,
  requestSupport,
};