const Asset = require('../models/Asset');
const intervals = { '1m': 60, '5m': 300,'15m':900,'30m':1800, '1h': 3600 };

const inMemoryCandles = {};

function getCandleKey(asset, interval) {
  return `${asset}_${interval}`;
}
function getIntervalStart(epoch, intervalSec) {
  return epoch - (epoch % intervalSec);
}

async function startCandleEngine() {
  const assets = await Asset.find();
  Object.keys(intervals).forEach(interval => {
    assets.forEach(asset => {
      const key = getCandleKey(asset.symbol, interval);
      setInterval(async () => {
        // 👇 Always fetch a fresh document!
        const assetDoc = await Asset.findOne({ symbol: asset.symbol });
        if (!assetDoc) return;

        const intervalSec = intervals[interval];
        const now = Math.floor(Date.now() / 1000);
        const intervalStart = getIntervalStart(now, intervalSec);

        let candle = inMemoryCandles[key];
        if (!candle || candle.time !== intervalStart) {
          const lastPrice = candle ? candle.close : assetDoc.last;
          candle = {
            time: intervalStart,
            open: lastPrice,
            high: lastPrice,
            low: lastPrice,
            close: lastPrice,
          };
        }
        let price = candle.close * (1 + (Math.random() - 0.5) * 0.002);
        price = Math.max(assetDoc.min, Math.min(assetDoc.max, price));
        candle.close = price;
        candle.high = Math.max(candle.high, price);
        candle.low = Math.min(candle.low, price);

        inMemoryCandles[key] = candle;
        assetDoc.last = price;
        await assetDoc.save(); // 👈 Only save the fresh doc!
      }, 1000);
    });
  });
}

module.exports = { inMemoryCandles, startCandleEngine, intervals, getCandleKey };
