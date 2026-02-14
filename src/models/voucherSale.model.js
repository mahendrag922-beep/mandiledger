const pool = require("../config/db");

exports.generateSaleVoucherNo = async (conn) => {
  const [[row]] = await conn.query(
    `SELECT voucher_no FROM voucher_sale
     ORDER BY id DESC LIMIT 1`
  );
  
// ✅ FIRST VOUCHER
  if (!row || !row.voucher_no) {
    return "SA-0001";
  }

  // ✅ SAFE PARSE
  const parts = row.voucher_no.split("-");
  const lastNo = parseInt(parts[1], 10);

  if (isNaN(lastNo)) {
    return "SA-0001";
  }

  return `SA-${String(lastNo + 1).padStart(4, "0")}`;

 };

exports.createSaleVoucher = async (data, conn) => {
  const [result] = await conn.query(
    `INSERT INTO voucher_sale
     (voucher_no, party_id, party_name, gst_no, address, place_of_supply,
      broker_id, broker_name, broker_company,
      transport_id, transport_name, driver_mobile, vehicle_no,
      commodity, hsn_no,
      total_weight_kg, final_weight_kg,
      rate_per_kg, total_amount, final_amount,
      created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.voucher_no,
      data.party_id,
      data.party_name,
      data.gst_no,
      data.address,
      data.place_of_supply,
      data.broker_id,
      data.broker_name,
      data.broker_company,
      data.transport_id,
      data.transport_name,
      data.driver_mobile,
      data.vehicle_no,
      data.commodity,
      data.hsn_no,
      data.total_weight_kg,
      data.final_weight_kg,
      data.rate_per_kg,
      data.total_amount,
      data.final_amount,
      data.created_by
    ]
  );

  return result.insertId;
};
exports.getSaleVouchers = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM voucher_sale ORDER BY id DESC"
  );
  return rows;
};
exports.updateSaleVoucher = async (id, data, conn) => {
  await conn.query(
    `UPDATE voucher_sale SET
      total_weight_kg=?,
      final_weight_kg=?,
      rate_per_kg=?,
      total_amount=?,
      final_amount=?,
      modified_at=NOW()
     WHERE id=?`,
    [
      data.total_weight_kg,
      data.final_weight_kg,
      data.rate_per_kg,
      data.total_amount,
      data.final_amount,
      id
    ]
  );
};
