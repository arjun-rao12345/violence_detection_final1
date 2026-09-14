const path = require('path');
const EmergencyAlertSchema = require('../Models/EmergencyAlert');

const projectRoot = path.resolve(__dirname, '..', '..');

function buildUploadUrl(filePath) {
  if (!filePath) {
    return null;
  }

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  const uploadsRoot = path.resolve(projectRoot, 'server', 'uploads');
  const relative = path.relative(uploadsRoot, filePath);
  if (!relative || relative.startsWith('..')) {
    return null;
  }

  const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4001}`;
  return `${serverUrl}/upload/${relative.split(path.sep).join('/')}`;
}

const Insert = async (req, res) => {
  try {
    const { incidentId, message, severity } = req.body;
    const newAlert = new EmergencyAlertSchema({
      incidentId,
      message,
      severity
    });
    const saved = await newAlert.save();
    res.json({ success: true, message: "Alert raised successfully", alert: saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error raising alert" });
  }
};

const GetAll = async (req, res) => {
  try {
    const alerts = await EmergencyAlertSchema.find({ status: 'Active' })
      .populate({
        path: 'incidentId',
        populate: { path: 'cameraId' }
      });

    const enriched = alerts.map((alert) => ({
      ...alert.toObject(),
      evidenceVideoUrl: buildUploadUrl(alert.evidenceVideo),
      evidenceImageUrl: buildUploadUrl(alert.evidenceImage)
    }));

    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error fetching alerts" });
  }
};

const Dismiss = async (req, res) => {
  try {
    const updated = await EmergencyAlertSchema.findByIdAndUpdate(req.params.id, { status: 'Dismissed' }, { new: true });
    res.json({ success: true, message: "Alert dismissed", alert: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error dismissing alert" });
  }
};

const Delete = async (req, res) => {
  try {
    await EmergencyAlertSchema.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Alert deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error deleting alert" });
  }
};

module.exports = { Insert, GetAll, Dismiss, Delete };
