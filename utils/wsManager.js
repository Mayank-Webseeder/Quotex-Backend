const { inMemoryCandles, getCandleKey } = require('../services/candleEngine');
const Asset = require('../models/Asset');

const clients = new Set();

function startWS(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.asset = 'BTC/USD';
    ws.interval = '1m';
    clients.add(ws);

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.asset) ws.asset = data.asset;
        if (data.interval) ws.interval = data.interval;
      } catch {}
    });

    ws.on('close', () => clients.delete(ws));
  });

  setInterval(async () => {
    for (const ws of clients) {
      const key = getCandleKey(ws.asset, ws.interval);
      const candle = inMemoryCandles[key];
      const assetObj = await Asset.findOne({ symbol: ws.asset });
      if (candle && assetObj) {
        ws.send(JSON.stringify({
          type: 'candle',
          candle,
          min: assetObj.min,
          max: assetObj.max,
          interval: ws.interval,
        }));
      }
    }
  }, 1000);
}

module.exports = { startWS };
