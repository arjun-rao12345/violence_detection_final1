const express = require('express');
const router = express.Router();

const {
  addPoliceStation,
  getPoliceStations,
  getPoliceStationById,
  updatePoliceStation,
  deletePoliceStation,
  requestSupport,
} = require('../Controller/policeStationController');

router.post('/addPoliceStation', addPoliceStation);
router.get('/getAllPoliceStations', getPoliceStations);
router.get('/getPoliceStationById/:id', getPoliceStationById);
router.put('/updatePoliceStation/:id', updatePoliceStation);
router.delete('/deletePoliceStation/:id', deletePoliceStation);
router.post('/:stationId/request-support', requestSupport);

module.exports = router;