const express = require('express')
const router = express.Router();
const auth = require("../Middleware/auth")
const authUser = require("../Middleware/authuser");
const {Insert,View,Delete,Getorder,ViewById,CancelOrder,ViewPayments,UpdateStatus} =  require('../Controller/orderController');

router.post("/insert",auth,Insert)
router.get("/get",View)
router.delete("/delete/:id",Delete)
router.get("/getorder/:id",auth,Getorder)
router.get("/getid", auth, ViewById)
router.put("/updatestatus/:orderId", UpdateStatus)
router.put('/cancel/:orderId', auth, CancelOrder);
router.get("/getpayment", ViewPayments);



module.exports = router;