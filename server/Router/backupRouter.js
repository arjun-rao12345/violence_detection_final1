const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const { Insert, GetAll, UpdateStatus, Delete } = require('../Controller/backupController');

router.post('/', auth, Insert);
router.get('/', auth, GetAll);
router.put('/:id/status', auth, UpdateStatus);
router.delete('/:id', auth, Delete);

module.exports = router;
