const pool = require("../config/db");

exports.createPaymentVoucher = async (data, conn = pool) => {
  const [result] = await conn.query(
    `INSERT INTO voucher_payment
     (party_id, party_name, amount, payment_mode, reference_no, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.party_id,
      data.party_name,
      data.amount,
      data.payment_mode,
      data.reference_no,
      data.created_by
    ]
  );

  return result.insertId;
};

exports.getPaymentVouchers = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM voucher_payment ORDER BY id DESC"
  );
  return rows;
};
