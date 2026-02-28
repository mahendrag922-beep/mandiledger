const pool = require("../config/db");

/* ==============================
   GET SINGLE TRANSPORT VOUCHER
============================== */
exports.getTransportVoucherById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[voucher]] = await pool.query(
      `SELECT * FROM transport_history WHERE id=?`,
      [id]
    );

    if (!voucher)
      return res.status(404).json({ message: "Voucher not found" });

    res.json({
      status: "success",
      data: voucher
    });

  } catch (err) {
    next(err);
  }
};
exports.getTransportHistory = async (req, res) => {

  const { voucherNo } = req.params;

  const [rows] = await pool.query(
    `SELECT *
     FROM transport_payment_history
     WHERE transport_voucher_no=?
     ORDER BY id ASC`,
    [voucherNo]
  );

  res.json({
    status: "success",
    data: rows
  });
};
