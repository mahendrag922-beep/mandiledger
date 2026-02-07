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

exports.getStock = async () => {
  const [rows] = await pool.query("SELECT * FROM stock");
  return rows;
};
