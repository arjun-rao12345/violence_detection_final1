const BackupRequestSchema = require('../Models/BackupRequest');

const Insert = async (req, res) => {
  try {
    const { incidentId } = req.body;
    const requestingOfficerId = req.user?.officerId || req.body.requestingOfficerId;

    if (!requestingOfficerId) {
      return res.status(400).json({ success: false, message: "Requesting officer ID is required" });
    }

    const newRequest = new BackupRequestSchema({
      incidentId,
      requestingOfficerId
    });
    const saved = await newRequest.save();
    res.json({ success: true, message: "Backup requested successfully", request: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error requesting backup" });
  }
};

const GetAll = async (req, res) => {
  try {
    const requests = await BackupRequestSchema.find()
      .populate('incidentId')
      .populate('requestingOfficerId', 'officerName badgeNumber phone');
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error fetching backup requests" });
  }
};

const UpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await BackupRequestSchema.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: "Backup request status updated", request: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error updating backup status" });
  }
};

const Delete = async (req, res) => {
  try {
    await BackupRequestSchema.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Backup request deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error deleting backup request" });
  }
};

module.exports = { Insert, GetAll, UpdateStatus, Delete };
