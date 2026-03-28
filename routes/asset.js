const express = require('express');
const router = express.Router();
const { getAssets, updateAssetRange,createAsset } = require('../controllers/asset.js');

router.get('/getAssets', getAssets);
router.patch('/:symbol', updateAssetRange);
router.post('/createAsset', createAsset);

module.exports = router;
