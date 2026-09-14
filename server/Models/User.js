const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      default: ""
    },

    password: {
      type: String,
      default: ""
    },

    googleId: {
      type: String,
      default: null
    },

    profileImage: {
      type: String,
      default: ""
    },

    loginType: {
      type: String,
      enum: ["normal", "google"],
      default: "normal"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", UserSchema);