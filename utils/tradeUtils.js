// Calculate next candle close time based on duration
exports.getNextCandleCloseTime = (duration, startTime = new Date()) => {
  const endTime = new Date(startTime);

  switch (duration) {
    case "1m":
      endTime.setMinutes(endTime.getMinutes() + 1);
      break;
    case "5m":
      endTime.setMinutes(endTime.getMinutes() + 5);
      break;
    case "15m":
      endTime.setMinutes(endTime.getMinutes() + 15);
      break;
    case "30m":
      endTime.setMinutes(endTime.getMinutes() + 30);
      break;
    case "1h":
      endTime.setHours(endTime.getHours() + 1);
      break;
    default:
      endTime.setMinutes(endTime.getMinutes() + 1);
  }

  return endTime;
};

// Check if trade has expired
exports.isTradeExpired = (trade) => {
  return new Date() >= new Date(trade.endTime);
};

// Determine trade result
exports.determineTradeResult = (trade, currentPrice) => {
  if (trade.direction === "up") {
    return currentPrice > trade.openPrice ? "won" : "lost";
  } else {
    return currentPrice < trade.openPrice ? "won" : "lost";
  }
};
