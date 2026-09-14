const jwt = require("jsonwebtoken");
require('dotenv').config()
const SECRETE = process.env.SECRETE_KEY || process.env.JWT_SECRET || "AUTHKEY";

const auth = (req, res, next) => {
  const token = req.header("auth-token") || req.header("authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ success: false, message: "Token not found" });
  }
  try {
    const userid = jwt.verify(token, SECRETE);
    req.user = userid;
    next();
  } catch (err) {
    // Also try alternate secret if defined
    if (process.env.JWT_SECRET && process.env.JWT_SECRET !== SECRETE) {
      try {
        const userid = jwt.verify(token, process.env.JWT_SECRET);
        req.user = userid;
        return next();
      } catch (e) {}
    }
    console.error("Auth error:", err.message);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = auth;
