const jwt = require('jsonwebtoken');

const fetchOfficer = (req, res, next) => {
  const token = req.header('auth-token') || req.header('authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided."
    });
  }

  try {
    const SECRETE = process.env.SECRETE_KEY || "AUTHKEY";
    const decoded = jwt.verify(token, SECRETE);
    req.user = { officerId: decoded.officerId };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

module.exports = fetchOfficer;