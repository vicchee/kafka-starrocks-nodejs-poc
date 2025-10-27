const { GAME_TYPE } = require("../constants/game-types");
const { randomDecimal, randomInt, randomString } = require("./random-utils");

function generateNewWager() {
  const gameType = GAME_TYPE[randomInt(0, GAME_TYPE.length - 1)];

  // Random wager_time within last 1.5 years
  const now = Date.now();
  const oneAndHalfYearAgo = now - 1.5 * 365 * 24 * 60 * 60 * 1000;
  const wagerTimeMs = randomInt(oneAndHalfYearAgo, now);
  const wagerTime = Math.floor(wagerTimeMs / 1000);

  // Settlement time: same day up to 2 months later
  const maxOffset = 2 * 30 * 24 * 60 * 60 * 1000; // 2 months in ms
  const settlementTimeMs = wagerTimeMs + randomInt(0, maxOffset);
  const settlementTime = Math.floor(settlementTimeMs / 1000);

  const wagerNo = Date.now().toString() + randomString(6); // unique

  return {
    game_type: gameType,
    wager_no: wagerNo,
    parent_wager_no: randomString(24),
    ticket_no: randomString(24),
    status: randomInt(0, 3),
    currency: "CNY",
    amount: randomDecimal(1, 1000),
    payment_amount: randomDecimal(1, 1000),
    effective_amount: randomDecimal(1, 1000),
    profit_and_loss: randomDecimal(-500, 500),
    wager_time: wagerTime,
    settlement_time: settlementTime,
    event_id: randomString(12),
    event_type: randomString(8),
    metadata_type: randomString(8),
    metadata: JSON.stringify({ order_no: randomString(24) }),
    is_system_reward: randomInt(0, 1),
    merchant_id: randomInt(1, 10),
    user_id: randomInt(1, 1000),
    updated_at: new Date().toISOString(),
  };
}

function generateFixedWager() {
  return {
    game_type: "PK10",
    wager_no: "202406210711291000000000M1018379602",
    parent_wager_no: "202406210711291000000000M1018379602",
    ticket_no: "202406210711291000000000M1018379602",
    status: 2,
    currency: "CNY",
    amount: 100.545869,
    payment_amount: 100.545869,
    effective_amount: 100,
    profit_and_loss: -100,
    wager_time: 1733216468,
    settlement_time: 1733216469,
    event_id: "123",
    event_type: "PK_event_type",
    metadata_type: "PK_type",
    metadata:
      '{"order_no":"202501171305401880119273817378816","origin_order_no":"202501171305401880119273817378816","origin_sub_order_no":"202501171305401880119273796407299"}',
    is_system_reward: 1,
    merchant_id: 2,
    user_id: 5,
    updated_at: new Date().toISOString(),
  };
}

module.exports = { generateFixedWager, generateNewWager };
