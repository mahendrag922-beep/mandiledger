const pool = require("../config/db");



/* 📜 Get Cash History */
exports.getCashHistory = async (req, res) => {

  const { cash_id } = req.params;

  const [rows] = await pool.query(
    `SELECT * FROM cash_transactions
     WHERE cash_id = ?`,
    [cash_id]
  );

  res.json({ status: "success", data: rows });
};
/* 💰 Get Available Cash (for payment dropdown) */
exports.getAvailableCash = async (req, res) => {

  const [rows] = await pool.query(
    `SELECT * FROM cash_entries
     WHERE remaining_amount > 0
     ORDER BY id DESC`
  );

  res.json({ status: "success", data: rows });
};
/* 📜 Get ALL Cash IDs (for history page) */
exports.getAllCash = async (req, res) => {

  const [rows] = await pool.query(
    `SELECT * FROM cash_entries
     ORDER BY id DESC`
  );

  res.json({ status: "success", data: rows });
};
