const pool = require("../config/db");

exports.getTransportVouchers = async () => {
  const [rows] = await pool.query(`
    SELECT *
    FROM transport_history
    ORDER BY id DESC
  `);

  return rows;
};
