const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// //  Session Schema
const sessionSchema = new mongoose.Schema({
  token: String,
  device: String,
  ip: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// //  OTP Schema
const otpSchema = new mongoose.Schema({
  code: String,
  expiresAt: Date,
  verified: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    default: ""
  },
  lastName: {
    type: String, 
    default: ""
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  //  Account Verification
  isVerified: {
    type: Boolean,
    default: false
  },

  isDeleted: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  //  Trading Accounts
  accounts: {
    demo: {
      balance: { type: Number, default: 10000 },
      isActive: { type: Boolean, default: true }
    },
    live: {
      balance: { type: Number, default: 0 },
      isActive: { type: Boolean, default: false }
    }
  },

  //  OTP (latest only)
  otp: otpSchema,

  //  Session login (multi-device)
  sessions: [sessionSchema]

}, { timestamps: true });


// Hash Password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


//  Compare Password (Login)
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};


//  Auto filter deleted users
// userSchema.pre(/^find/, function (next) {
//   this.find({ isDeleted: false });
//   next();
// });


module.exports = mongoose.model("User", userSchema);
