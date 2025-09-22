const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const sendResponse = require("../utils/sendResponse");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

//routes
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    //validation
    // if (!username || !email || !password) {
    //   return sendResponse(res,400,false,"please provide all fields")
    // }
    // chekc user
    const exisiting = await userModel.findOne({ email });
    if (exisiting) {
      return sendResponse(
        res,
        400,
        false,
        "user with this email already resgiterd"
      );
    }
    const user = await userModel.create({
      username,
      email,
      password,
    });
    sendResponse(res, 201, true, "user succesfully registered", user);
  } catch (error) {
    console.log(error);
    sendResponse(
      res,
      500,
      false,
      "interval server error in resgister api",
      error
    );
  }
});

// LOGIN || POST
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    //validfatuion
    if (!email || !password) {
      return sendResponse(res, 500, false, "Please provide email or password");
    }
    //check user
    const user = await userModel.findOne({ email });
    if (!user) {
      return sendResponse(res, 404, false, "user not found");
    }
    //check user password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 400, false, "invalid Credentials");
    }
    // token
    const token = JWT.sign(
      { _id: user._id },
      "myseretkeyinexpressapplication",
      { expiresIn: "7d" }
    );
    sendResponse(res, 200, true, "login successfully", token);
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, false, "error in login api", error);
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      sendResponse(res, 404, false, "User not found for this email");
    }

    // generate reset token
    const resetToken = crypto.randomBytes(32).toString("Hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const resetUrl = `http://localhost:3000/auth/reset-password/${resetToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "password reset request",
      text: `click here to reset your password ${resetUrl}`,
    });
    sendResponse(
      res,
      200,
      true,
      "password reset link send to email please check your email"
    );
  } catch (error) {
    sendResponse(res, 500, false, "error in reset password", error.message);
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;
    const user = await userModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return sendResponse(res, 400, false, "invalid or expired token");
    }
    if (newPassword !== confirmPassword) {
      return sendResponse(
        res,
        400,
        false,
        "newpassword and confirm password should be same"
      );
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    sendResponse(res, 200, true, "password reset succesfully");
  } catch (error) {
    sendResponse(res, 500, false, "error in password reset api", error.message);
  }
});
module.exports = router;
