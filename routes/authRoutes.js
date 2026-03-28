const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware.js");

const { signup, login, verifyOTP, logout } = require("../controllers/authController");

//  Signup Route
router.post("/signup", signup);

//verify otp for signup
router.post("/verify-otp", verifyOTP);

//login route
router.post("/login", login);

//logout route
router.post("/logout", authenticate, logout);

module.exports = router;
