const WebSocket = require("ws");
const Trade = require("../models/Trade/trade");
const { isTradeExpired, determineTradeResult } = require("./tradeUtils");

let wss;
let clients = new Map(); // Store client connections with userId

// Function to check and update expired trades
const checkExpiredTrades = async () => {
  try {
    const expiredTrades = await Trade.find({
      status: "pending",
      endTime: { $lte: new Date() },
      isActive: true,
      isDeleted: false,
    });

    for (const trade of expiredTrades) {
      // In a real implementation, you would get the current price from your price feed
      // For this example, we'll use the open price (you should implement proper price fetching)
      const currentPrice = trade.openPrice; // Replace with actual current price
      const result = determineTradeResult(trade, currentPrice);

      trade.status = result;
      trade.closedPrice = currentPrice;
      trade.isActive = false;
      await trade.save();

      // Broadcast trade result to the specific user
      broadcastTradeResult(trade.userId, trade);
    }
  } catch (error) {
    console.error("Error checking expired trades:", error);
  }
};

// Run trade checker every second
setInterval(checkExpiredTrades, 1000);

// Start WebSocket server
const startWS = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");

    // Send initial connection message
    ws.send(
      JSON.stringify({
        type: "connection",
        message: "Connected to WebSocket server",
        timestamp: new Date().toISOString(),
      }),
    );

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case "authenticate":
            // Store user ID for this connection
            clients.set(data.userId, ws);
            ws.userId = data.userId;

            // Send user's active trades
            const activeTrades = await Trade.find({
              userId: data.userId,
              status: "pending",
              isActive: true,
            });

            ws.send(
              JSON.stringify({
                type: "active_trades",
                data: activeTrades,
              }),
            );
            break;

          case "subscribe_trade":
            // Subscribe to specific trade updates
            ws.subscribedTrades = ws.subscribedTrades || new Set();
            ws.subscribedTrades.add(data.tradeId);
            break;

          case "get_trade_updates":
            // Request updates for specific trades
            const trades = await Trade.find({
              tradeId: { $in: data.tradeIds },
            });
            ws.send(
              JSON.stringify({
                type: "trade_updates",
                data: trades,
              }),
            );
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: error.message,
          }),
        );
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      // Remove client from clients map
      if (ws.userId) {
        clients.delete(ws.userId);
      }
    });
  });

  return wss;
};

// Broadcast trade result to specific user
const broadcastTradeResult = (userId, trade) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(
      JSON.stringify({
        type: "trade_result",
        data: trade,
      }),
    );
  }
};

// Broadcast trade update to user
const broadcastTradeUpdate = (trade) => {
  const client = clients.get(trade.userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(
      JSON.stringify({
        type: "trade_update",
        data: trade,
      }),
    );
  }
};

// Broadcast new trade to user
const broadcastNewTrade = (trade) => {
  const client = clients.get(trade.userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(
      JSON.stringify({
        type: "new_trade",
        data: trade,
      }),
    );
  }
};

// Broadcast timer update for upcoming trade
const broadcastTimerUpdate = (userId, tradeId, remainingTime) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(
      JSON.stringify({
        type: "timer_update",
        tradeId,
        remainingTime,
        timestamp: new Date().toISOString(),
      }),
    );
  }
};

// Function to start timer for a trade
const startTradeTimer = (userId, tradeId, endTime) => {
  const timer = setInterval(async () => {
    const now = new Date();
    const remaining = new Date(endTime) - now;

    if (remaining <= 0) {
      clearInterval(timer);
      return;
    }

    broadcastTimerUpdate(userId, tradeId, remaining);
  }, 1000);

  return timer;
};

module.exports = {
  startWS,
  broadcastTradeResult,
  broadcastTradeUpdate,
  broadcastNewTrade,
  startTradeTimer,
  broadcastTimerUpdate,
};
