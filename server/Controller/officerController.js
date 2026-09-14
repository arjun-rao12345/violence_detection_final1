
const OfficerSchema = require("../Models/Officer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateSecurityCode = require("../utils/generateSecurityCode");
const { sendOfficerSecurityCode } = require("../utils/sendMail");



const SECRETE = process.env.SECRETE_KEY;
// Police Officer Login
const Login = async (req, res) => {
  try {
    const { badgeId, badgeNumber, password } = req.body;
    const badge = badgeId || badgeNumber;

    if (!badge || !password) {
      return res.status(400).json({
        success: false,
        message: "Badge number and security code are required",
      });
    }

    const officer = await OfficerSchema.findOne({ badgeNumber: badge });

    if (!officer) {
      return res.status(400).json({
        success: false,
        message: "Invalid Badge Number or Security Code",
      });
    }

    const isMatch = await bcrypt.compare(password, officer.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Badge Number or Security Code",
      });
    }

    const token = jwt.sign({ officerId: officer._id }, SECRETE);

    res.json({
      success: true,
      message: "Login successful",
      loggedInOfficer: officer,
      token,
      firstLogin: officer.firstLogin,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Server Error during login",
    });
  }
};

// Insert Officer
const Insert = async (req, res) => {
  try {
    const {
      stationId,
      stationCode,
      officerName,
      badgeNumber,
      rank,
      email,
      phone,
      status,
    } = req.body;

    const existingBadge = await OfficerSchema.findOne({ badgeNumber });
    if (existingBadge) {
      return res.status(400).json({
        success: false,
        message: "Officer with this Badge Number already exists",
      });
    }

    const existingEmail = await OfficerSchema.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Officer with this Email already exists",
      });
    }

    const securityCode = generateSecurityCode();
    const hashedCode = await bcrypt.hash(securityCode, 10);

    const newOfficer = new OfficerSchema({
      stationId,
      stationCode,
      officerName,
      badgeNumber,
      rank,
      email,
      phone,
      password: hashedCode,
      firstLogin: true,
      status: status || "Active",
    });

    const saved = await newOfficer.save();

    await sendOfficerSecurityCode(
      email,
      officerName,
      badgeNumber,
      securityCode
    );

    res.json({
      success: true,
      message: "Officer added successfully. Security code sent to registered email.",
      officer: saved,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error adding officer",
      error: error.message,
    });
  }
};

// Get All Officers
const GetAll = async (req, res) => {
  try {
    const officers = await OfficerSchema.find()
      .populate("stationId")
      .select("-password");

    res.json(officers);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Server Error fetching officers",
    });
  }
};

// Update Officer
const Update = async (req, res) => {
  try {
    const {
      stationId,
      stationCode,
      officerName,
      badgeNumber,
      rank,
      email,
      phone,
      // password,
      status,
    } = req.body;

    const updateData = {
      stationId,
      stationCode,
      officerName,
      badgeNumber,
      rank,
      email,
      phone,
      status,
    };

    // if (password) {
    //   updateData.password = await bcrypt.hash(password, 10);
    //   updateData.firstLogin = false;
    // }

    const updated = await OfficerSchema.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("stationId")
      .select("-password");

    res.json({
      success: true,
      message: "Officer updated successfully",
      officer: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error updating officer",
      error: error.message,
    });
  }
};

// Delete Officer
const Delete = async (req, res) => {
  try {
    await OfficerSchema.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Officer deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Server Error deleting officer",
    });
  }
};
const ChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const officerId = req.user.officerId;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const officer = await OfficerSchema.findById(officerId);

    if (!officer) {
      return res.status(404).json({
        success: false,
        message: "Officer not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, officer.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password/security code is wrong",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    officer.password = hashedPassword;
    officer.firstLogin = false;

    await officer.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error changing password",
      error: error.message,
    });
  }
};
module.exports = { Login, Insert, GetAll, Update, Delete ,ChangePassword};

