require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const { startWS } = require('./utils/wsManager');
const { startCandleEngine } = require('./services/candleEngine');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/assets', require('./routes/asset'));
app.use('/api/v1/candles', require('./routes/candle'));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await startCandleEngine();
    const server = http.createServer(app);
    startWS(server);
    server.listen(process.env.PORT || 3001, () => {
      console.log('Server running on port', process.env.PORT || 3001);
    });
  });
