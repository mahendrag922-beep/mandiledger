const pool = require("../config/db");

/* CREATE */
exports.createBroker = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO brokers
     (broker_name, company_name, mobile_primary, mobile_alt,
      address, district, state, pincode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.broker_name,
      data.company_name,
      data.mobile_primary,
      data.mobile_alt,
      data.address,
      data.district,
      data.state,
      data.pincode
    ]
  );

  return result.insertId;
};

/* GET ALL */
exports.getAllBrokers = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM brokers
     WHERE is_deleted = 0
     ORDER BY broker_name ASC`
  );
  return rows;
};

/* GET ONE */
exports.getBrokerById = async (id) => {
  const [[row]] = await pool.query(
    `SELECT * FROM brokers
     WHERE id = ? AND is_deleted = 0`,
    [id]
  );
  return row;
};

/* UPDATE */
exports.updateBroker = async (id, data) => {
  await pool.query(
    `UPDATE brokers SET
      broker_name = ?,
      company_name = ?,
      mobile_primary = ?,
      mobile_alt = ?,
      address = ?,
      district = ?,
      state = ?,
      pincode = ?,
      modified_at = NOW()
     WHERE id = ?`,
    [
      data.broker_name,
      data.company_name,
      data.mobile_primary,
      data.mobile_alt,
      data.address,
      data.district,
      data.state,
      data.pincode,
      id
    ]
  );
};

/* SOFT DELETE */
exports.deleteBroker = async (id) => {
  await pool.query(
    `UPDATE brokers
     SET is_deleted = 1,
         modified_at = NOW()
     WHERE id = ?`,
    [id]
  );
};
