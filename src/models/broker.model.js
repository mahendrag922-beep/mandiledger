const pool = require("../config/db");

exports.create = async (data) => {
  const { name, mobile, address, district, state, pincode } = data;

  const [res] = await pool.query(
    `INSERT INTO brokers
     (name, mobile, address, district, state, pincode)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, mobile, address, district, state, pincode]
  );

  return res.insertId;
};

exports.getAll = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM brokers WHERE is_active = 1 ORDER BY id DESC"
  );
  return rows;
};

exports.getById = async (id) => {
  const [[row]] = await pool.query(
    "SELECT * FROM brokers WHERE id = ?",
    [id]
  );
  return row;
};
