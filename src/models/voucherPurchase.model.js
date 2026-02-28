const pool = require("../config/db");


exports.getPurchaseVouchers = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM voucher_purchase ORDER BY id DESC"
  );
  return rows;
};


exports.generatePurchaseVoucherNo = async (conn = pool) => {
  const [[row]] = await conn.query(
    `SELECT voucher_no FROM voucher_purchase
     WHERE voucher_no IS NOT NULL
     ORDER BY id DESC LIMIT 1`
  );

  // ✅ FIRST VOUCHER
  if (!row || !row.voucher_no) {
    return "PU-0001";
  }

  // ✅ SAFE PARSE
  const parts = row.voucher_no.split("-");
  const lastNo = parseInt(parts[1], 10);

  if (isNaN(lastNo)) {
    return "PU-0001";
  }

  return `PU-${String(lastNo + 1).padStart(4, "0")}`;
};
exports.updatePurchaseVoucher = async (id, data, conn) => {
  await conn.query(
    `UPDATE voucher_purchase SET
      commodity = ?,
      bags = ?,
      total_weight_kg = ?,
      wajan_dhalta_kg = ?,
      final_weight_kg = ?,
      rate_per_kg = ?,
      total_amount = ?,
      commission_percent = ?,
      commission_amount = ?,
      final_amount = ?,
      modified_at = NOW()
     WHERE id = ?`,
    [
      data.commodity,
      data.bags,
      data.total_weight_kg,
      data.wajan_dhalta_kg,
      data.final_weight_kg,
      data.rate_per_kg,
      data.total_amount,
      data.commission_percent,
      data.commission_amount,
      data.final_amount,
      id
    ]
  );
};

