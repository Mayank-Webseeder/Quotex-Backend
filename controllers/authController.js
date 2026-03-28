const jwt = require("jsonwebtoken");
const User = require("../models/User");

//  OTP generate function
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

//  Signup API
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, country } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      if (exists.isVerified) {
        return res.status(400).json({ message: "User already exists" });
      }

      const otpCode = generateOTP();

      exists.otp = {
        code: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      };

      await exists.save();

      return res.json({
        success: true,
        message: "OTP resent",
        otp: otpCode // testing
      });
    }

    // new user
    const otpCode = generateOTP();

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      country,
      otp: {
        code: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    res.status(201).json({
      success: true,
      message: "OTP sent to email",
      otp: otpCode // testing
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify OTP API
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.otp) {
      return res.status(400).json({ message: "Invalid request" });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    //  verify user
    user.isVerified = true;
    user.otp = undefined; // 🔥 cleanup

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.sessions.push({
      token,
      device: "web",
      ip: req.ip
    });

    await user.save();

    user.password = undefined;

    res.json({
      success: true,
      message: "OTP verified & login successful",
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Login API
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || user.isDeleted) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Account not verified" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.sessions.push({
      token,
      device: "web",
      ip: req.ip
    });

    await user.save();

    user.password = undefined;
    res.json({
      success: true,
      message: "Login successful",
      token,
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  signup,
  verifyOTP,
  login
};