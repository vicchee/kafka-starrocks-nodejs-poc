const { query } = require("../../common/db");

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
    default:
      dateFormat = "%b %Y";
  }

  for (const [key, value] of Object.entries({
    merchant_id,
    user_id,
    game_type,
  })) {
    if (value !== undefined) {
      conditions.push(`${key} = ?`);
      settlementConditions.push(`${key} = ?`);
      params.push(value);
      settlementParams.push(value);
    }
  }

  if (from) {
    conditions.push("wager_time >= UNIX_TIMESTAMP(?)");
    settlementConditions.push("settlement_time >= UNIX_TIMESTAMP(?)");
    params.push(from);
    settlementParams.push(from);
  }
  if (to) {
    conditions.push("wager_time <= UNIX_TIMESTAMP(?)");
    settlementConditions.push("settlement_time <= UNIX_TIMESTAMP(?)");
    params.push(to);
    settlementParams.push(to);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const settlementWhere = settlementConditions.length
    ? `WHERE ${settlementConditions.join(" AND ")}`
    : "";

  const wagersSql = `
    SELECT
      DATE_FORMAT(FROM_UNIXTIME(wager_time), '${dateFormat}') AS group_col,
      COUNT(*) AS total_wager_count,
      SUM(amount) AS total_amount,
      SUM(effective_amount) AS total_effective_amount
    FROM wagers
    ${whereClause}
    GROUP BY group_col
  `;

  const profitSql = `
    SELECT
      DATE_FORMAT(FROM_UNIXTIME(settlement_time), '${dateFormat}') AS group_col,
      SUM(profit_and_loss) AS total_profit_and_loss
    FROM wagers
    ${settlementWhere}
    GROUP BY group_col
  `;

  const wagersRows = await query(wagersSql, params);
  const profitRows = await query(profitSql, settlementParams);

  const merged = {};

  // Add wager rows
  for (const row of wagersRows) {
    merged[row.group_col] = {
      group_col: row.group_col,
      total_wager_count: row.total_wager_count,
      total_amount: row.total_amount,
      total_effective_amount: row.total_effective_amount,
      total_profit_and_loss: Number(0).toFixed(6),
    };
  }

  // Merge profit rows
  for (const row of profitRows) {
    if (!merged[row.group_col]) {
      // Row exists only in settlement
      merged[row.group_col] = {
        group_col: row.group_col,
        total_wager_count: 0,
        total_amount: Number(0).toFixed(6),
        total_effective_amount: Number(0).toFixed(6),
        total_profit_and_loss: row.total_profit_and_loss,
      };
    } else {
      merged[row.group_col].total_profit_and_loss = row.total_profit_and_loss;
    }
  }

  const parseGroup = (g) => {
    switch (group_by.toLowerCase()) {
      case "day":
        return new Date(g); // YYYY-MM-DD
      case "year":
        return new Date(`${g}-01-01`);
      default: {
        // %b %Y, e.g. "Oct 2025"
        const [mon, yr] = g.split(" ");
        return new Date(`${mon} 1, ${yr}`);
      }
    }
  };

  return Object.values(merged).sort(
    (a, b) => parseGroup(a.group_col) - parseGroup(b.group_col)
  );
}

async function queryWagersCombined({
  merchant_id,
  user_id,
  game_type,
  from,
  to,
  group_by = "month",
}) {
  let dateFormat, orderFormat;
  switch (group_by.toLowerCase()) {
    case "day":
      dateFormat = "%Y-%m-%d";
      orderFormat = "%Y-%m-%d";
      break;
    case "year":
      dateFormat = "%Y";
      orderFormat = "%Y-01-01";
      break;
    default:
      dateFormat = "%b %Y";
      orderFormat = "%Y-%m-01";
  }

  const wagerFilters = [];
  const settleFilters = [];
  const wagerParams = [];
  const settleParams = [];

  for (const [key, value] of Object.entries({
    merchant_id,
    user_id,
    game_type,
  })) {
    if (value !== undefined) {
      wagerFilters.push(`w1.${key} = ?`);
      settleFilters.push(`w2.${key} = ?`);
      wagerParams.push(value);
      settleParams.push(value);
    }
  }

  if (from) {
    wagerFilters.push("w1.wager_time >= UNIX_TIMESTAMP(?)");
    settleFilters.push("w2.settlement_time >= UNIX_TIMESTAMP(?)");
    wagerParams.push(from);
    settleParams.push(from);
  }

  if (to) {
    wagerFilters.push("w1.wager_time <= UNIX_TIMESTAMP(?)");
    settleFilters.push("w2.settlement_time <= UNIX_TIMESTAMP(?)");
    wagerParams.push(to);
    settleParams.push(to);
  }

  // Combine params for UNION ALL (wager first, then settlement)
  const params = [...wagerParams, ...settleParams];

  const wagerWhere = wagerFilters.length
    ? `WHERE ${wagerFilters.join(" AND ")}`
    : "";
  const settleWhere = settleFilters.length
    ? `WHERE ${settleFilters.join(" AND ")}`
    : "";

  const sql = `
    SELECT
      group_col,
      SUM(total_wager_count) AS total_wager_count,
      SUM(total_amount) AS total_amount,
      SUM(total_effective_amount) AS total_effective_amount,
      SUM(total_profit_and_loss) AS total_profit_and_loss
    FROM (
      SELECT
        DATE_FORMAT(FROM_UNIXTIME(w1.wager_time), '${dateFormat}') AS group_col,
        UNIX_TIMESTAMP(DATE_FORMAT(FROM_UNIXTIME(w1.wager_time), '${orderFormat}')) AS group_order,
        COUNT(*) AS total_wager_count,
        SUM(w1.amount) AS total_amount,
        SUM(w1.effective_amount) AS total_effective_amount,
        0 AS total_profit_and_loss
      FROM wagers w1
      ${wagerWhere}
      GROUP BY group_col, group_order

      UNION ALL

      SELECT
        DATE_FORMAT(FROM_UNIXTIME(w2.settlement_time), '${dateFormat}') AS group_col,
        UNIX_TIMESTAMP(DATE_FORMAT(FROM_UNIXTIME(w2.settlement_time), '${orderFormat}')) AS group_order,
        0 AS total_wager_count,
        0 AS total_amount,
        0 AS total_effective_amount,
        SUM(w2.profit_and_loss) AS total_profit_and_loss
      FROM wagers w2
      ${settleWhere}
      GROUP BY group_col, group_order
    ) t
    GROUP BY group_col, group_order
    ORDER BY group_order;
  `;

  return query(sql, params);
}

module.exports = { queryWagers, queryWagersCombined };
