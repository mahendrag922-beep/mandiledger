const pool = require("../config/db");

exports.generatePaymentVoucherNo = async (conn) => {

  const [[row]] = await conn.query(
    `SELECT payment_voucher_no
     FROM voucher_payment
     ORDER BY id DESC LIMIT 1`
  );

  if (!row || !row.payment_voucher_no)
    return "PAY-0001";

  const last = parseInt(row.payment_voucher_no.split("-")[1]);

  return `PAY-${String(last + 1).padStart(4, "0")}`;
};

exports.createPaymentVoucher = async (data, conn) => {

  await conn.query(
    `INSERT INTO voucher_payment
     (payment_voucher_no, party_id, party_name,
      address, purchase_voucher_no,
      payment_type, cash_id,
      bank_name, bank_entry_id,
      amount, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.payment_voucher_no,
      data.party_id,
      data.party_name,
      data.address,
      data.purchase_voucher_no,
      data.payment_type,
      data.cash_id || null,
      data.bank_name || null,
      data.bank_entry_id || null,
      data.amount,
      data.created_by
    ]
  );
};

exports.getPaymentVouchers = async () => {

  const [rows] = await pool.query(
    `SELECT * FROM voucher_payment
     ORDER BY id DESC`
  );

  return rows;
};