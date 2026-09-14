const jwt = require("jsonwebtoken");
require('dotenv').config()
const SECRETE = process.env.SECRETE_KEY ;

const authUser = (req,res,next)=>{
 
    const token = req.header("auth-token");
    if(!token){
        res.send("token not found");
    }
    try{
        const deliveryid = jwt.verify(token,SECRETE)
        req.delivery = deliveryid;
        next();
    }catch(err){
        console.log(err)
    }
};
module.exports = authUser;