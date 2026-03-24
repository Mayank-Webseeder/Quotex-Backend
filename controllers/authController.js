const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if ( !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ firstName, lastName, email, password });

    res.status(201).json({
      success: true,
      message: "Signup successful",
      data: user
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
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
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login };