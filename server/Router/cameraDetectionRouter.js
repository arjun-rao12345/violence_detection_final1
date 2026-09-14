const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const { startCameraDetection, stopCameraDetection, getRunningCameras, getCameraStatus } = require('../controllers/cameraDetectionController');

router.post('/:cameraId/start', auth, startCameraDetection);
router.post('/:cameraId/stop', auth, stopCameraDetection);
router.get('/running', auth, getRunningCameras);
router.get('/:cameraId/status', auth, getCameraStatus);

module.exports = router;
