const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// ==========================================
// REGISTER
// ==========================================

const Register = async (req, res) => {

  try {

    const {
      name,
      email,
      phone,
      password
    } = req.body;


    // Validate

    if (
      !name ||
      !email ||
      !password
    ) {

      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });

    }


    // Check existing user

    const existingUser =
      await User.findOne({
        email
      });


    if (existingUser) {

      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });

    }


    // Hash password

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );


    // Create user

    const user =
      await User.create({

        name,

        email,

        phone,

        password:
          hashedPassword,

        loginType:
          "normal"

      });


    res.status(201).json({

      success: true,

      message:
        "Registration successful",

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone

      }

    });


  } catch (error) {

    console.error(
      "Register error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Server error"

    });

  }

};



// ==========================================
// LOGIN
// ==========================================

const Login = async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    if (
      !email ||
      !password
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Email and password are required"

      });

    }


    // Find user

    const user =
      await User.findOne({
        email
      });


    if (!user) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password"

      });

    }


    // Google account cannot use normal login

    if (
      user.loginType === "google" &&
      !user.password
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Please login using Google"

      });

    }


    // Compare password

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!passwordMatch) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password"

      });

    }


    // Create JWT

    const token = jwt.sign(
  { id: user._id },   // <-- must be "id", not "_id" or "userId"
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

    res.status(200).json({

      success: true,

      message:
        "Login successful",

      token,

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone

      }

    });


  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Server error"

    });

  }

};


module.exports = {
  Register,
  Login
};