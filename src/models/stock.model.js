const pool = require("../config/db");

exports.updateStock = async ({ commodity, quantity, conn }) => {
  const [rows] = await conn.query(
    "SELECT * FROM stock WHERE commodity = ?",
    [commodity]
  );

  if (rows.length === 0) {
    await conn.query(
      "INSERT INTO stock (commodity, quantity) VALUES (?, ?)",
      [commodity, quantity]
    );
  } else {
    await conn.query(
      "UPDATE stock SET quantity = quantity + ? WHERE commodity = ?",
      [quantity, commodity]
    );
  }
};

/* GET ALL STOCK */
exports.getAllStock = async () => {
  const [rows] = await pool.query(
    `SELECT id, commodity, hsn_no, quantity
     FROM stock
     WHERE is_deleted = 0
     ORDER BY commodity ASC`
  );
  return rows;
};

/* ADD COMMODITY */
exports.addCommodity = async (data) => {
  await pool.query(
    `INSERT INTO stock (commodity, hsn_no, quantity)
     VALUES (?, ?, 0)`,
    [data.commodity.toLowerCase(), data.hsn_no]
  );
};

/* DELETE COMMODITY */
exports.deleteCommodity = async (id) => {
  await pool.query(
    `UPDATE stock
     SET is_deleted = 1
     WHERE id = ?`,
    [id]
  );
};
