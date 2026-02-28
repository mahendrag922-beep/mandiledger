const pool = require("../config/db");

exports.generateReceiptVoucherNo = async (conn) => {

  const [[row]] = await conn.query(
    `SELECT receipt_voucher_no
     FROM voucher_receipt
     ORDER BY id DESC LIMIT 1`
  );

  if (!row || !row.receipt_voucher_no)
    return "REC-0001";

  const last = parseInt(row.receipt_voucher_no.split("-")[1]);

  return `REC-${String(last + 1).padStart(4, "0")}`;
};

exports.createReceiptVoucher = async (data, conn) => {

  await conn.query(
    `INSERT INTO voucher_receipt
     (receipt_voucher_no, mill_id, mill_name,
      mill_address, sale_voucher_no,
      bank_name, amount,case_discount ,
  weight_shortage ,
  unloading_charges ,
  brokerage_commission ,
  quality_claim ,
  bank_charges ,
  final_received_amount, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?)`,
    [
      data.receipt_voucher_no,
      data.mill_id,
      data.mill_name,
      data.mill_address,
      data.sale_voucher_no,
      data.bank_name,
      data.amount,
      data.case_discount ,
      data.weight_shortage ,
      data.unloading_charges ,
      data.brokerage_commission ,
      data.quality_claim ,
      data.bank_charges ,
      data.final_received_amount,
      data.created_by
    ]
  );
};

exports.getReceiptVouchers = async () => {

  const [rows] = await pool.query(
    `SELECT * FROM voucher_receipt
     ORDER BY id DESC`
  );

  return rows;
};