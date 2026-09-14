
const express = require('express')
const router = express.Router();
const {Count} = require('../Controller/overallController');


router.get("/get",Count)

module.exports = router;