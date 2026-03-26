const mongoose = require("mongoose");

const TradeSchema = new mongoose.Schema(
  {
    tradeId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    asset: { type: String, required: true },
    amount: { type: Number, required: true },
    direction: { type: String, enum: ["up", "down"], required: true },
    payOut: { type: Number, required: true },
    tax: { type: Number, required: true },
    openPrice: { type: Number, required: true },
    closedPrice: { type: Number },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    assetName: { type: String, required: true },
    assetType: { type: String, required: true },
    assetId: { type: String, required: true },
    currency: { type: String, required: true },
    pendingTrade: { type: Boolean, default: true },
    dummyTrade: { type: Boolean, default: false },
    duration: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "won", "lost"],
      default: "pending",
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const tradeSchema = mongoose.model("trade", TradeSchema);
module.exports = tradeSchema;
