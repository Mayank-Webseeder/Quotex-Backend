const express = require("express");
const router = express.Router();
const { authenticate } = require("../../middleware/authMiddleware");
const {
  createTrade,
  getUserTrades,
  getTradeById,
  closeTrade,
  getTradeStats,
  cancelTrade,
  getActiveTrades,
} = require("../../controllers/Trade/tradeController");

// All routes require authentication
router.use(authenticate);

// Trade routes
router.post("/create", createTrade);
router.get("/trades", getUserTrades);
router.get("/active", getActiveTrades);
router.get("/stats", getTradeStats);
router.get("/:tradeId", getTradeById);
router.put("/:tradeId/close", closeTrade);
router.delete("/:tradeId/cancel", cancelTrade);

module.exports = router;
