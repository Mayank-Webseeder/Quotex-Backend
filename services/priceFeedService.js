const Asset = require('../models/Asset');
const intervals = { '1m': 60, '5m': 300, '10m':600, "15m":900,"30m":1800 , '1h': 3600 };

// In-memory candles: { asset_interval: { ...candle } }
const inMemoryCandles = {}; // Only current candle per asset/interval

function getCandleKey(asset, interval) {
  return `${asset}_${interval}`;
}

function getIntervalStart(epoch, intervalSec) {
  return epoch - (epoch % intervalSec);
}

async function updateCandle(asset, interval) {
  const intervalSec = intervals[interval];
  const now = Math.floor(Date.now() / 1000);
  const intervalStart = getIntervalStart(now, intervalSec);
  const key = getCandleKey(asset, interval);

  let candle = inMemoryCandles[key];
  const assetObj = await Asset.findOne({ symbol: asset });

  // If new interval, start a new candle
  if (!candle || candle.time !== intervalStart) {
    const lastPrice = candle ? candle.close : assetObj.last;
    candle = {
      time: intervalStart,
      open: lastPrice,
      high: lastPrice,
      low: lastPrice,
      close: lastPrice,
    };
  }

  // Simulate price movement for the current tick
  let price = candle.close * (1 + (Math.random() - 0.5) * 0.002);
  price = Math.max(assetObj.min, Math.min(assetObj.max, price));
  candle.close = price;
  candle.high = Math.max(candle.high, price);
  candle.low = Math.min(candle.low, price);

  inMemoryCandles[key] = candle;
  assetObj.last = price;
  await assetObj.save();

  return candle;
}

// For historical candles, you can generate them on the fly or store only closed ones if needed.

module.exports = { updateCandle, intervals, inMemoryCandles };
