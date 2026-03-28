const express = require("express");
const router = express.Router();

const { signup, login, verifyOTP } = require("../controllers/authController");

//  Signup Route
router.post("/signup", signup);

//verify otp for signup
router.post("/verify-otp", verifyOTP);

//login route
router.post("/login", login);

module.exports = router;
