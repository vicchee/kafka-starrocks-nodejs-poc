const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "starrocks", // container name in Docker network
  port: 9030,
  user: "root",
  password: "",
  database: "starrocks",
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
