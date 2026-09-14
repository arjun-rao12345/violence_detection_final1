const IncidentSchema = require('../Models/Incident');
const CameraSchema = require('../Models/Camera');
const OfficerSchema = require('../Models/Officer');

// Get statistics for the dashboard
const GetStats = async (req, res) => {
  try {
    const camerasCount = await CameraSchema.countDocuments({ status: 'Active' });
    const threatsCount = await IncidentSchema.countDocuments({ status: { $ne: 'Resolved' } });
    const officersCount = await OfficerSchema.countDocuments({ status: { $in: ['Active', 'On Duty'] } });
    const resolvedCount = await IncidentSchema.countDocuments({ status: 'Resolved' });

    // Recent critical/warning incidents
    const recentAlerts = await IncidentSchema.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('cameraId')
      .populate('assignedOfficerId', 'officerName badgeNumber');

    res.json({
      cameras: camerasCount,
      threats: threatsCount,
      officers: officersCount,
      reports: resolvedCount,
      alerts: recentAlerts.map(alert => ({
        id: alert._id,
        time: alert.timestamp,
        location: alert.address,
        cameraName: alert.cameraName || alert.cameraId?.cameraName,
        type: alert.type,
        status: alert.status === 'Pending' ? 'Critical' : 'Warning',
        assignedOfficer: alert.assignedOfficerId ? alert.assignedOfficerId.officerName : null,
        evidenceVideo: alert.evidenceVideo || null,
        evidenceImage: alert.evidenceImage || null
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error fetching stats" });
  }
};

// Create a new threat log (e.g., triggered by surveillance AI detection)
const Insert = async (req, res) => {
  try {
    const { type, cameraId, cameraName, detectionType, confidence, severity, latitude, longitude, address, location, description, evidenceVideo, evidenceImage, responseStatus } = req.body;
    
    const newIncident = new IncidentSchema({
      type,
      cameraId,
      cameraName,
      detectionType,
      confidence,
      severity,
      latitude,
      longitude,
      address,
      location,
      description,
      evidenceVideo,
      evidenceImage,
      responseStatus
    });

    const saved = await newIncident.save();

    // Increment alertsCount in Camera model if cameraId is provided
    if (cameraId) {
      await CameraSchema.findByIdAndUpdate(cameraId, {
        $inc: { alertsCount: 1 },
        lastThreatDetected: Date.now()
      });
    }

    res.json({ success: true, message: "Incident logged successfully", incident: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error logging incident" });
  }
};

// Get all incidents
const GetAll = async (req, res) => {
  try {
    const incidents = await IncidentSchema.find()
      .populate('cameraId')
      .populate('assignedOfficerId', 'officerName badgeNumber phone');
    res.json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error fetching incidents" });
  }
};

// Get incidents assigned to a specific officer
const GetAssigned = async (req, res) => {
  try {
    const officerId = req.params.officerId;
    const incidents = await IncidentSchema.find({ assignedOfficerId: officerId })
      .populate('cameraId');
    res.json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error fetching assigned cases" });
  }
};

// Update incident status (e.g., assign officer or mark as resolved)
const Update = async (req, res) => {
  try {
    const { status, assignedOfficerId, responseStatus } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (assignedOfficerId) updateData.assignedOfficerId = assignedOfficerId;
    if (responseStatus) updateData.responseStatus = responseStatus;

    if (status === 'Resolved' || responseStatus === 'Resolved') {
      updateData.resolvedAt = Date.now();
    }

    const updated = await IncidentSchema.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedOfficerId', 'officerName badgeNumber');
      
    res.json({ success: true, message: "Incident status updated", incident: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error updating incident status" });
  }
};

// Delete incident
const Delete = async (req, res) => {
  try {
    await IncidentSchema.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Incident deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error deleting incident" });
  }
};

module.exports = { GetStats, Insert, GetAll, GetAssigned, Update, Delete };
