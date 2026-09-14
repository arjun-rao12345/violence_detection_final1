const mongoose = require("mongoose");
const ViolenceReport = require("../Models/ViolenceReport");
const PoliceStation = require("../Models/policeStation");
const Officer = require("../Models/Officer");


// ==========================================
// CALCULATE DISTANCE BETWEEN TWO LOCATIONS
// ==========================================

const calculateDistance = (lat1, lon1, lat2, lon2) => {

  const R = 6371; // Earth radius in KM

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *

    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};


// ==========================================
// INSERT VIOLENCE REPORT
// FIND NEAREST POLICE STATION
// ASSIGN ONE OFFICER FROM THAT STATION
// ==========================================

const Insert = async (req, res) => {

  try {

    const {
      incidentNumber,
      category,
      severity,
      location,
      latitude,
      longitude,
      description,
      isAnonymous,
      isInjured,
      policeStationId: selectedStationId // from the dropdown
    } = req.body;

    let latNum = Number(latitude);
    let lonNum = Number(longitude);
    if (!latitude || !longitude || isNaN(latNum) || isNaN(lonNum)) {
      // Default fallback coordinates if user typed location without pinning map
      latNum = 12.9141;
      lonNum = 74.8560;
    }

    let nearestStation = null;
    let shortestDistance = Infinity;
    let policeStationId = null;
    let status = "Pending";

    // 1. Use the station the user picked, if one was sent
    if (selectedStationId) {
      const chosenStation = await PoliceStation.findById(selectedStationId);
      if (chosenStation) {
        nearestStation = chosenStation;
        shortestDistance =
          chosenStation.latitude != null && chosenStation.longitude != null
            ? calculateDistance(
                latNum,
                lonNum,
                Number(chosenStation.latitude),
                Number(chosenStation.longitude)
              )
            : 0;
        policeStationId = chosenStation._id;
        status = "Assigned";
      }
    }

    // 2. Fallback: auto-detect nearest station
    if (!policeStationId) {
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
    }

    // ==========================================
    // ASSIGN ONE OFFICER FROM THE STATION
    // (if 2+ officers belong to the station, take only 1)
    // ==========================================

    let assignedOfficerId = null;

    if (policeStationId) {
      const officerAtStation = await Officer.findOne({
        stationId: policeStationId,
        status: "Active"
      }).sort({ createdAt: 1 }); // deterministic pick: earliest-created officer

      if (officerAtStation) {
        assignedOfficerId = officerAtStation._id;
      }
    }

    // Uploaded images

    const images = req.files
      ? req.files.map((file) => file.path)
      : [];


    // Create report
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in authentication token"
      });
    }

    const newReport = new ViolenceReport({
      incidentNumber,
      userId: req.user.id,

      category,
      severity,
      location,

      latitude: latNum,
      longitude: lonNum,

      description,
      images,

      isAnonymous:
        isAnonymous === "true" ||
        isAnonymous === true,

      isInjured:
        isInjured === "true" ||
        isInjured === true,

      policeStationId,
      assignedOfficerId,

      distanceFromStation:
        shortestDistance !== Infinity ? Number(shortestDistance.toFixed(2)) : 0,

      status
    });

    const savedReport =
      await newReport.save();


    // Populate police station + officer information

    const report =
      await ViolenceReport
        .findById(savedReport._id)
        .populate(
          "policeStationId",
          "stationName address latitude longitude"
        )
        .populate(
          "assignedOfficerId",
          "officerName badgeNumber rank"
        );


    res.status(201).json({

      success: true,

      message:
        policeStationId
          ? "Report submitted and assigned to nearest police station"
          : "Report submitted but no police station found within 10 KM",

      report,

      nearestStation: nearestStation
        ? {
            id: nearestStation._id,
            stationName: nearestStation.stationName,
            address: nearestStation.address,
            distance: `${shortestDistance.toFixed(2)} KM`
          }
        : null

    });


  } catch (error) {

    console.error(
      "Error submitting violence report:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Server error submitting report",

      error:
        error.message

    });

  }

};


// ==========================================
// GET ALL REPORTS
// ==========================================

const GetAll = async (req, res) => {

  try {

    const reports =
      await ViolenceReport
        .find()
        .populate(
          "policeStationId",
          "stationName address"
        )
        .populate(
          "assignedOfficerId",
          "officerName badgeNumber rank"
        )
        .sort({
          createdAt: -1
        });


    res.status(200).json({

      success: true,

      reports

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,

      message:
        "Error fetching reports"

    });

  }

};


// ==========================================
// GET REPORT BY ID
// ==========================================

const GetById = async (req, res) => {

  try {

    const report =
      await ViolenceReport
        .findById(req.params.id)
        .populate(
          "policeStationId",
          "stationName address latitude longitude"
        )
        .populate(
          "assignedOfficerId",
          "officerName badgeNumber rank"
        );


    if (!report) {

      return res.status(404).json({

        success: false,

        message: "Report not found"

      });

    }


    res.json({

      success: true,

      report

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,

      message:
        "Error fetching report"

    });

  }

};


// ==========================================
// GET REPORTS FOR ONE POLICE STATION
// ==========================================

const GetReportsByStation = async (req, res) => {

  try {

    const reports =
      await ViolenceReport
        .find({

          policeStationId:
            req.params.stationId

        })
        .populate(
          "assignedOfficerId",
          "officerName badgeNumber rank"
        )
        .sort({
          createdAt: -1
        });


    res.json({

      success: true,

      reports

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,

      message:
        "Error fetching station reports"

    });

  }

};


// ==========================================
// UPDATE REPORT STATUS
// ==========================================

const UpdateStatus = async (req, res) => {

  try {

    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Assigned",
      "Under Review",
      "Dispatched",
      "Resolved"
    ];

    if (!allowedStatuses.includes(status)) {

      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });

    }

    const updatedReport =
      await ViolenceReport.findByIdAndUpdate(
        req.params.id,
        {
          status
        },
        {
          new: true,
          runValidators: true
        }
      )
        .populate(
          "policeStationId",
          "stationName address"
        )
        .populate(
          "assignedOfficerId",
          "officerName badgeNumber rank"
        );

    if (!updatedReport) {

      return res.status(404).json({
        success: false,
        message: "Report not found"
      });

    }

    res.json({
      success: true,
      message: "Report status updated successfully",
      report: updatedReport
    });

  } catch (error) {

    console.error(
      "Error updating report status:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Error updating report status",
      error: error.message
    });

  }
};


// ==========================================
// DELETE REPORT
// ==========================================

const Delete = async (req, res) => {

  try {

    await ViolenceReport
      .findByIdAndDelete(
        req.params.id
      );


    res.json({

      success: true,

      message:
        "Report deleted successfully"

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,

      message:
        "Error deleting report"

    });

  }

};


// ==========================================
// GET REPORTS ASSIGNED TO THE LOGGED-IN OFFICER'S POLICE STATION
// ==========================================

const GetMyAssignedReports = async (req, res) => {

  try {

    if (!req.user || !req.user.officerId) {
      return res.status(401).json({
        success: false,
        message: "Officer ID not found in authentication token"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.officerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid officer ID in token"
      });
    }

    const officer = await Officer.findById(req.user.officerId);
console.log("officer",officer)
    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Officer not found"
      });
    }

    // Match reports assigned to THIS officer specifically,
    // using the officerId from the logged-in token
    const reports =
      await ViolenceReport
        .find({
          assignedOfficerId: officer._id
        })
        .populate(
          "policeStationId",
          "stationName address"
        )
        .populate(
          "assignedOfficerId",
          "officerName badgeNumber rank"
        )
        .sort({
          createdAt: -1
        });
console.log("myreport",reports)
    res.status(200).json({
      success: true,
      count: reports.length,
      officer: {
        id: officer._id,
        officerName: officer.officerName,
        badgeNumber: officer.badgeNumber
      },
      station: officer.stationId,
      reports
    });

  } catch (error) {

    console.error(
      "Error fetching assigned reports:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Error fetching assigned reports",
      error: error.message
    });

  }

};

// ==========================================
// GET REPORTS SUBMITTED BY LOGGED-IN USER
// ==========================================
const GetMyReports = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication token invalid or missing"
      });
    }

    const reports = await ViolenceReport.find({ userId })
      .populate("policeStationId", "stationName address latitude longitude phone email inchargeName")
      .populate("assignedOfficerId", "officerName badgeNumber rank phone email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("GetMyReports error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving your reports",
      error: error.message
    });
  }
};

module.exports = {

  Insert,
  GetAll,
  GetById,
  GetReportsByStation,
  GetMyAssignedReports,
  GetMyReports,
  UpdateStatus,
  Delete

};