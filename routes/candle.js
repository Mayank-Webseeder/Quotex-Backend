const express = require('express');
const router = express.Router();
const { getCandles } = require('../controllers/candle');

router.get('/getCandles', getCandles);

module.exports = router;
