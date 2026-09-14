const AdminSchema = require('../Models/admin');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRETE_KEY = "AUTHKEY";


const Insert = async (req, res) => {

    try{
        console.log(req.body,"mydata")
        const {email,password} = req.body;
        let checkmail = await AdminSchema.findOne({email:email});

        if(checkmail){
            console.log("Email already exists");
            res.json({status: false, message: "Email already exists"});
        }else{
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(password, salt);
            console.log(hashPassword,"hashPassword")
            let newUser = new AdminSchema({
                email,
                password: hashPassword,
            });

            let savedUser = await newUser.save();
            console.log("New Admin registered successfully");
            res.json({
                success: true,
                message: "New Admin registered successfully",
                user:savedUser

            });
        }
    }catch(err){

        console.log(err);
    }
}

const Login = async (req, res) => {

    try {
        const { email, password } = req.body;
        console.log(req.body)

        if(!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        let admin = await AdminSchema.findOne({email:email});

        if(!admin){
            console.log("invalid Credentail: No admin found in this email");
            return res.status(400).json({ success: false, message: "Invalid Credential!" });
        }

        if(!admin.password) {
            console.log("Errroe: admin does not have Password field.");
            return res.status(400).json({ success: false, message: "admin password not found" });
        }

         let checkpass = await bcrypt.compare(password, admin.password);

        if(!checkpass){
            console.log("Invalid Credential: Password does not match");
            return res.status(400).json({ success: false, message: "Invalid Credential!" });
        }

        let adminid = admin._id;
        let token = jwt.sign({ adminid }, SECRETE_KEY);
        console.log(token,"token")

        console.log("Login successful");
        return res.json({
            message: "Login successful",
            success: true,
            loggedInUser: admin,
            adminToken: token
            
        });

    }catch(error){
        console.error("Error occurred during login:", error);
         return res.status(500).json({error:"An error occurred during login",details:error});
    }
}
module.exports={Insert,Login}