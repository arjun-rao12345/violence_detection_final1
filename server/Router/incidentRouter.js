const express = require('express');
const router = express.Router();
const { GetStats, Insert, GetAll, GetAssigned, Update, Delete } = require('../Controller/incidentController');

router.get('/stats', GetStats);
router.post('/', Insert);
router.get('/', GetAll);
router.get('/assigned/:officerId', GetAssigned);
router.put('/:id', Update);
router.delete('/:id', Delete);

module.exports = router;
