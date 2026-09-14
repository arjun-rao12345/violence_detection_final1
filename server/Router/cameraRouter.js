const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const { Insert, GetAll, Update, Delete } = require('../Controller/cameraController');
const { startCameraDetection, stopCameraDetection, getRunningCameras, getCameraStatus, mockCameraAlert } = require('../controllers/cameraDetectionController');

router.post('/', auth, Insert);
router.get('/', auth, GetAll);
router.put('/:id', auth, Update);
router.delete('/:id', auth, Delete);
router.post('/:cameraId/start', auth, startCameraDetection);
router.post('/:cameraId/stop', auth, stopCameraDetection);
router.post('/:cameraId/mock-alert', auth, mockCameraAlert);
router.get('/running', auth, getRunningCameras);
router.get('/:cameraId/status', auth, getCameraStatus);

module.exports = router;
