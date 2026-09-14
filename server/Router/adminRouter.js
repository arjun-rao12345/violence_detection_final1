const express = require('express')
const router = express.Router();
 const {Insert,Login} =  require('../Controller/adminController')

router.post('/admininsert',Insert)
router.post('/login',Login)


module.exports= router;
