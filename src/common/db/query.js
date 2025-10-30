const pool = require("./pool");
const { logger } = require("../logger");

const query = async (sql, params = []) => {
  logger.debug({ sql, params }, "Executing SQL query");
  const start = Date.now();
  try {
    const [rows] = await pool.query(sql, params);
    logger.trace(
      { rowCount: rows.length, durationMs: Date.now() - start },
      "Query result"
    );
    return rows;
  } catch (err) {
    logger.error({ sql, params, err }, "SQL query failed");
    throw err;
  }
};

module.exports = query;
