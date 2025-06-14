const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  symbol: { type: String, unique: true, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  last: { type: Number, required: true },
});

module.exports = mongoose.model('Asset', assetSchema);
