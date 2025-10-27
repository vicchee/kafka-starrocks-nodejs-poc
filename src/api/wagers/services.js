const pool = require("../../common/db/pool");

async function queryWagers({
  merchant_id,
  user_id,
  game_type,
  from,
  to,
  group_by = "month",
}) {
  const conditions = [];
  const params = [];
  const settlementConditions = [];
  const settlementParams = [];

  let dateFormat;

  switch (group_by.toLowerCase()) {
    case "day":
      dateFormat = "%Y-%m-%d";
      break;
    case "year":
      dateFormat = "%Y";
      break;
    case "month":
    default:
      dateFormat = "%b %Y";
      break;
  }
  if (merchant_id) {
    conditions.push("merchant_id = ?");
    params.push(merchant_id);
    settlementConditions.push("merchant_id = ?");
    settlementParams.push(merchant_id);
  }
  if (user_id) {
    conditions.push("user_id = ?");
    params.push(user_id);
    settlementConditions.push("user_id = ?");
    settlementParams.push(user_id);
  }
  if (game_type) {
    conditions.push("game_type = ?");
    params.push(game_type);
    settlementConditions.push("game_type = ?");
    settlementParams.push(game_type);
  }
  if (from) {
    conditions.push("wager_time >= UNIX_TIMESTAMP(?)");
    params.push(from);
    settlementConditions.push("settlement_time >= UNIX_TIMESTAMP(?)");
    settlementParams.push(from);
  }
  if (to) {
    conditions.push("wager_time <= UNIX_TIMESTAMP(?)");
    params.push(to);
    settlementConditions.push("settlement_time <= UNIX_TIMESTAMP(?)");
    settlementParams.push(to);
  }

  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";

  // 1. total wagers and total amount grouped by wager_time month
  const wagersSql = `
    SELECT
      DATE_FORMAT(FROM_UNIXTIME(wager_time), '${dateFormat}') AS group_col,
      COUNT(*) AS total_wager_count,
      SUM(amount) AS total_amount,
      SUM(effective_amount) AS total_effective_amount
    FROM wagers
    ${whereClause}
    GROUP BY DATE_FORMAT(FROM_UNIXTIME(wager_time), '${dateFormat}')
  `;

  // 2. total profit and loss grouped by settlement_time month
  const settlementWhere = settlementConditions.length
    ? "WHERE " + settlementConditions.join(" AND ")
    : "";

  const profitSql = `
    SELECT
      DATE_FORMAT(FROM_UNIXTIME(settlement_time), '${dateFormat}') AS group_col,
      SUM(profit_and_loss) AS total_profit_and_loss
    FROM wagers
    ${settlementWhere}
    GROUP BY DATE_FORMAT(FROM_UNIXTIME(settlement_time), '${dateFormat}')
  `;

  const [wagersRows] = await pool.query(wagersSql, params);
  const [profitRows] = await pool.query(profitSql, settlementParams);

  // merge by group_col
  const merged = {};
  wagersRows.forEach((row) => {
    merged[row.group_col] = {
      group: row.group_col,
      total_wager_count: row.total_wager_count,
      total_amount: row.total_amount,
      total_effective_amount: row.total_effective_amount,
      total_profit_and_loss: 0,
    };
  });
  profitRows.forEach((row) => {
    if (!merged[row.group_col]) {
      merged[row.group_col] = {
        group: row.group_col,
        total_wager_count: 0,
        total_amount: 0,
        total_effective_amount: 0,
      };
    }
    merged[row.group_col].total_profit_and_loss = row.total_profit_and_loss;
  });

  return Object.values(merged).sort((a, b) => {
    const dateA = new Date(a.group);
    const dateB = new Date(b.group);
    return dateA - dateB;
  });
}

module.exports = { queryWagers };
