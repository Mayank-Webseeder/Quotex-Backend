const mongoose = require('mongoose');

const candleSchema = new mongoose.Schema({
  asset: { type: String, required: true },
  interval: { type: String, required: true },
  time: { type: Number, required: true },
  open: Number,
  high: Number,
  low: Number,
  close: Number,
});

candleSchema.index({ asset: 1, interval: 1, time: 1 }, { unique: true });
module.exports = mongoose.model('Candle', candleSchema);
