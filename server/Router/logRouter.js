const express = require("express");
const router = express.Router();
const { createLog } = require("../Controller/logController");
const auth = require("../Middleware/auth"); // middleware for JWT

router.post("/insert", auth, createLog);
module.exports = router;
