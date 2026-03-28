const { inMemoryCandles, intervals } = require('../services/priceFeedService');
const Asset = require('../models/Asset');

// Generate historical candles in-memory for the last N intervals
exports.getCandles = async (req, res) => {
  const { asset, interval } = req.query;
  const assetObj = await Asset.findOne({ symbol: asset });
  const intervalSec = intervals[interval];
  const now = Math.floor(Date.now() / 1000);
  const candles = [];
  if (!candles) {
    // Handle the error, e.g. return an error response
    return res.status(400).json({ success: false, message: 'No candle data found.' });
  }
  let lastClose = assetObj.last ?? 100;

  // Generate last 100 candles (not persisted)
  for (let i = 99; i >= 0; i--) {
    const time = now - (now % intervalSec) - i * intervalSec;
    // Simulate OHLC for demo; in production, use real or stored data
    const open = lastClose;
    const close = open * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(open, close) + Math.random() * 0.001;
    const low = Math.min(open, close) - Math.random() * 0.001;
    candles.push({ time, open, high, low, close });
    lastClose = close;
  }

  res.json({
    candles,
    min: assetObj?.min ?? 0,
    max: assetObj?.max ?? 0,
  });
};
