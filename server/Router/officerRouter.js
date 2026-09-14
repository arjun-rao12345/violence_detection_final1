const express = require('express');
const router = express.Router();
const { Login, Insert, GetAll, Update, Delete ,ChangePassword} = require('../Controller/officerController');
const auth = require('../Middleware/auth')
router.post('/login', Login);
router.post('/InsertOfficer', Insert);
router.get('/GetAllOfficer', GetAll);
router.put('/UpdateOfficer/:id', Update);
router.delete('/DeleteOfficer/:id', Delete);
router.put("/change-password", auth, ChangePassword);
module.exports = router;