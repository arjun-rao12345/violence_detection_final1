const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const { TriggerSOS } = require("../Controller/SOSController");

router.post("/trigger", auth, TriggerSOS);

module.exports = router;
