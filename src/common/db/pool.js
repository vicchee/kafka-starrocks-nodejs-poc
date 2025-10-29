const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.STARROCKS_HOST || "starrocks",
  port: Number(process.env.STARROCKS_PORT) || 9030,
  user: process.env.STARROCKS_USER || "root",
  password: process.env.STARROCKS_PASSWORD || "",
  database: process.env.STARROCKS_DB || "starrocks",
  waitForConnections: true,
  connectionLimit: 10,
});

const query = async (sql, params) => {
  console.log("[SQL]", sql);
  console.log("[PARAMS]", params);
  const [rows] = await pool.query(sql, params);
  return rows;
};

module.exports = { pool, query };
