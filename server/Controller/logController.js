const LogSchema = require("../Models/log");

const createLog = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.userid;

    // 1. Check for a log created in the last 2 seconds (to prevent double-mount hits)
    const twoSecondsAgo = new Date(Date.now() - 2000); 
    const existingLog = await LogSchema.findOne({
      user_id: userId,
      product_id: productId,
      createdAt: { $gte: twoSecondsAgo }
    });

    if (existingLog) {
      // Just return success without saving a new one
      return res.json({ success: true, message: "Duplicate prevented" });
    }

    const newLog = new LogSchema({ user_id: userId, product_id: productId });
    await newLog.save();

    res.json({ success: true, message: "Log created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createLog };
