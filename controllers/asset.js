const Asset = require('../models/Asset');

exports.getAssets = async (req, res) => {
  const assets = await Asset.find();
  res.json(assets);
};

exports.createAsset = async (req, res) => {
  try {
    const { symbol, min, max, last } = req.body;
    if (!symbol || min == null || max == null || last == null) {
      return res.status(400).json({ error: 'symbol, min, max, and last are required' });
    }
    const asset = new Asset({ symbol, min, max, last });
    await asset.save();
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAssetRange = async (req, res) => {
  const { symbol } = req.params;
  const { min, max } = req.body;
  if (min == null || max == null) {
    return res.status(400).json({ error: 'min and max are required' });
  }
  const asset = await Asset.findOneAndUpdate(
    { symbol },
    { min, max },
    { new: true }
  );
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  res.json(asset);
};
