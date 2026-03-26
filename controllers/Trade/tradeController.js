const Trade = require("../../models/Trade/trade");
const { v4: uuidv4 } = require("uuid");
const { getNextCandleCloseTime } = require("../../utils/tradeUtils");
const {
  broadcastTradeUpdate,
  broadcastNewTrade,
} = require("../../utils/wsManager");

// Create a new trade
exports.createTrade = async (req, res) => {
  try {
    const {
      amount,
      direction,
      openPrice,
      assetName,
      assetType,
      assetId,
      currency,
      duration,
    } = req.body;

    const userId = req.user.id; // Assuming user is authenticated

    // Calculate end time based on duration
    const startTime = new Date();
    const endTime = getNextCandleCloseTime(duration, startTime);

    // Calculate tax and payout (example: 2% tax, 85% payout)
    const tax = amount * 0.02;
    const payOut = amount * 0.85;

    const trade = new Trade({
      tradeId: uuidv4(),
      userId,
      amount,
      direction,
      payOut,
      tax,
      openPrice,
      startTime,
      endTime,
      assetName,
      assetType,
      assetId,
      currency,
      duration,
      pendingTrade: false,
      dummyTrade: false,
      status: "pending",
    });

    await trade.save();

    // Broadcast new trade via WebSocket
    broadcastNewTrade(trade);

    res.status(201).json({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error("Create trade error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all trades for a user
exports.getUserTrades = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10, startDate, endDate } = req.query;

    const query = { userId, isDeleted: false };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const trades = await Trade.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Trade.countDocuments(query);

    res.status(200).json({
      success: true,
      data: trades,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get trades error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single trade by ID
exports.getTradeById = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.id;

    const trade = await Trade.findOne({ tradeId, userId, isDeleted: false });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found",
      });
    }

    res.status(200).json({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error("Get trade error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Close trade manually (if needed)
exports.closeTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { closedPrice } = req.body;
    const userId = req.user.id;

    const trade = await Trade.findOne({ tradeId, userId, isDeleted: false });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found",
      });
    }

    if (trade.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Trade is already closed",
      });
    }

    // Determine trade result
    let status;
    if (trade.direction === "up") {
      status = closedPrice > trade.openPrice ? "won" : "lost";
    } else {
      status = closedPrice < trade.openPrice ? "won" : "lost";
    }

    trade.closedPrice = closedPrice;
    trade.status = status;
    trade.isActive = false;
    trade.endTime = new Date();

    await trade.save();

    // Broadcast trade update via WebSocket
    broadcastTradeUpdate(trade);

    res.status(200).json({
      success: true,
      data: trade,
    });
  } catch (error) {
    console.error("Close trade error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get trade statistics
exports.getTradeStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Trade.aggregate([
      { $match: { userId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          wonTrades: {
            $sum: { $cond: [{ $eq: ["$status", "won"] }, 1, 0] },
          },
          lostTrades: {
            $sum: { $cond: [{ $eq: ["$status", "lost"] }, 1, 0] },
          },
          pendingTrades: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          totalAmount: { $sum: "$amount" },
          totalPayout: { $sum: "$payOut" },
          totalTax: { $sum: "$tax" },
        },
      },
    ]);

    const result = stats[0] || {
      totalTrades: 0,
      wonTrades: 0,
      lostTrades: 0,
      pendingTrades: 0,
      totalAmount: 0,
      totalPayout: 0,
      totalTax: 0,
    };

    result.winRate =
      result.totalTrades > 0
        ? ((result.wonTrades / result.totalTrades) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get trade stats error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel pending trade
exports.cancelTrade = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.id;

    const trade = await Trade.findOne({ tradeId, userId, isDeleted: false });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: "Trade not found",
      });
    }

    if (trade.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed trade",
      });
    }

    trade.isActive = false;
    trade.isDeleted = true;
    trade.status = "lost"; // Mark as lost when cancelled

    await trade.save();

    res.status(200).json({
      success: true,
      message: "Trade cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel trade error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get active trades
exports.getActiveTrades = async (req, res) => {
  try {
    const userId = req.user.id;

    const trades = await Trade.find({
      userId,
      isActive: true,
      status: "pending",
      isDeleted: false,
    }).sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      data: trades,
    });
  } catch (error) {
    console.error("Get active trades error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
