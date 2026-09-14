const CameraSchema = require('../Models/Camera');

const Insert = async (req, res) => {
  try {
    const { cameraName, latitude, longitude, address, streamUrl, ipAddress, resolution, nightVision, policeStationId } = req.body;
    const sanitizedPoliceStationId = (policeStationId === '' || policeStationId === undefined) ? null : policeStationId;
    const newCamera = new CameraSchema({
      cameraName,
      latitude,
      longitude,
      address,
      streamUrl,
      ipAddress,
      resolution,
      nightVision,
      policeStationId: sanitizedPoliceStationId
    });
    const saved = await newCamera.save();
    const populated = await CameraSchema.findById(saved._id).populate('policeStationId');
    res.json({ success: true, message: "Camera added successfully", camera: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error adding camera" });
  }
};

const GetAll = async (req, res) => {
  try {
    const cameras = await CameraSchema.find().populate('policeStationId');
    res.json(cameras);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error fetching cameras" });
  }
};

const Update = async (req, res) => {
  try {
    const { cameraName, latitude, longitude, address, streamUrl, ipAddress, status, resolution, nightVision, policeStationId } = req.body;
    const sanitizedPoliceStationId = (policeStationId === '' || policeStationId === undefined) ? null : policeStationId;
    const updated = await CameraSchema.findByIdAndUpdate(req.params.id, {
      cameraName,
      latitude,
      longitude,
      address,
      streamUrl,
      ipAddress,
      status,
      resolution,
      nightVision,
      policeStationId: sanitizedPoliceStationId
    }, { new: true }).populate('policeStationId');
    res.json({ success: true, message: "Camera updated successfully", camera: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error updating camera" });
  }
};

const Delete = async (req, res) => {
  try {
    await CameraSchema.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Camera deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error deleting camera" });
  }
};

module.exports = { Insert, GetAll, Update, Delete };
