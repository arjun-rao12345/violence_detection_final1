const mongoose = require("mongoose");
const ViolenceReport = require("../Models/ViolenceReport");
const PoliceStation = require("../Models/policeStation");
const Officer = require("../Models/Officer");

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const TriggerSOS = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Location is required for SOS" });
    }

    let latNum = Number(latitude);
    let lonNum = Number(longitude);

    let nearestStation = null;
    let shortestDistance = Infinity;
    let policeStationId = null;
    let status = "Pending";

    // Detect nearest station
    const stations = await PoliceStation.find();
    if (stations && stations.length > 0) {
      stations.forEach((station) => {
        if (station.latitude != null && station.longitude != null) {
          const distance = calculateDistance(
            latNum,
            lonNum,
            Number(station.latitude),
            Number(station.longitude)
          );
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestStation = station;
          }
        }
      });

      if (nearestStation) {
        policeStationId = nearestStation._id;
        status = "Assigned";
      }
    }

    // Assign one officer
    let assignedOfficerId = null;
    if (policeStationId) {
      const officerAtStation = await Officer.findOne({
        stationId: policeStationId,
        status: "Active"
      }).sort({ createdAt: 1 });

      if (officerAtStation) {
        assignedOfficerId = officerAtStation._id;
      }
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to send an SOS alert."
      });
    }

    const incidentNumber = "SOS-" + Date.now() + Math.floor(Math.random() * 1000);

// build the SOS report object
    const newReport = new ViolenceReport({
      incidentNumber,
      userId: req.user.id,
      category: "SOS Emergency",
      severity: "urgent",
      location: "GPS Location Provided",
      latitude: latNum,
      longitude: lonNum,
      description: "Emergency SOS Alert triggered by user.",
      isAnonymous: false,
      isInjured: true, // Assuming potential injury in SOS
      policeStationId,
      assignedOfficerId,
      distanceFromStation: shortestDistance !== Infinity ? Number(shortestDistance.toFixed(2)) : 0,
      status,
    });
    // after creating the report object, save it
    const savedReport = await newReport.save();

    // send email notification to the requesting user if email is configured
    const User = require('../Models/User');
    const requestingUser = await User.findById(req.user.id);
    const userEmail = requestingUser && requestingUser.email ? requestingUser.email : null;
    if (userEmail) {
      const { sendIncidentAlertEmail } = require('../utils/sendMail');
      try {
        await sendIncidentAlertEmail(
          userEmail,
          requestingUser.name || 'User',
          'SOS Alert Triggered',
          'Mobile App',
          `Lat: ${latNum}, Lon: ${lonNum}`,
          null,
          null,
          {
            detectionType: 'SOS',
            confidence: 1,
            timestamp: new Date().toISOString(),
          },
          nearestStation ? nearestStation.stationName : 'N/A',
          null,
          null
        );
      } catch (mailErr) {
        console.error('Error sending SOS email to user:', mailErr);
      }
    }

    // optional: also notify the police station if it has an email configured
    if (nearestStation && nearestStation.email) {
      const { sendIncidentAlertEmail } = require('../utils/sendMail');
      try {
        await sendIncidentAlertEmail(
          nearestStation.email,
          nearestStation.stationName,
          'SOS Alert Triggered',
          'Mobile App',
          `Lat: ${latNum}, Lon: ${lonNum}`,
          null,
          null,
          {
            detectionType: 'SOS',
            confidence: 1,
            timestamp: new Date().toISOString(),
          },
          nearestStation.stationName,
          null,
          null
        );
      } catch (mailErr) {
        console.error('Error sending SOS email to station:', mailErr);
      }
    }

    const report = await ViolenceReport.findById(savedReport._id)
      .populate("policeStationId", "stationName address latitude longitude phone")
      .populate("assignedOfficerId", "officerName badgeNumber rank phone");

    res.status(201).json({
      success: true,
      message: policeStationId
        ? "SOS Sent! Assigned to nearest police station."
        : "SOS Sent! No police station found nearby.",
      report,
      nearestStation: nearestStation
        ? {
            id: nearestStation._id,
            stationName: nearestStation.stationName,
            address: nearestStation.address,
            phone: nearestStation.phone,
            distance: `${shortestDistance.toFixed(2)} KM`
          }
        : null
    });

  } catch (error) {
    console.error("Error triggering SOS:", error);
    res.status(500).json({
      success: false,
      message: "Server error triggering SOS",
      error: error.message
    });
  }
};

module.exports = {
  TriggerSOS
};
