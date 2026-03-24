const pool = require("../config/db");

exports.commodityStockReport = async (req, res, next) => {
  const [rows] = await pool.query(`
    SELECT
      commodity,
      IFNULL(quantity, 0) AS stock
    FROM stock
    ORDER BY commodity
  `);

  res.json({
    status: "success",
    data: rows
  });
};

exports.dailyReport = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT DATE(created_at) date,
            COUNT(*) entries,
            SUM(total_amount) total
     FROM purchases
     WHERE DATE(created_at) = CURDATE()`
  );

  res.json({
    status: "success",
    data: rows[0]
  });
};


/* =========================================
   OUTSTANDING REPORT
========================================= */

exports.outstandingReport = async (req, res) => {
  try {

    /* ======================================
       FARMER + MILL + TRADER (LEDGER BASED)
    ====================================== */

    const [ledgerRows] = await pool.query(`
      SELECT 
        p.id AS party_id,
        p.name,
        p.party_type,
        l.voucher_no,
        SUM(l.debit) AS total_debit,
        SUM(l.credit) AS total_credit,
        (SUM(l.debit) - SUM(l.credit)) AS balance
      FROM ledger_entries l
      JOIN parties p ON p.id = l.party_id
      WHERE p.party_type IN ('farmer','mill','trader')
      GROUP BY p.id, l.voucher_no
      HAVING balance > 0
    `);

    /* ======================================
       TRANSPORT (REMAINING PAYMENT BASED)
    ====================================== */

    const [transportRows] = await pool.query(`
      SELECT
        p.id AS party_id,
        p.name,
        'transport' AS party_type,
        t.transport_voucher_no AS voucher_no,
        t.remaining_payment AS balance
      FROM transport_history t
      JOIN transports tr ON tr.id = t.transport_id
      JOIN parties p ON p.id = tr.party_id
      WHERE t.remaining_payment > 0
    `);

    res.json({
      status: "success",
      data: [...ledgerRows, ...transportRows]
    });

  } catch (err) {
    console.error("Outstanding error:", err);
    res.status(500).json({ error: err.message });
  }
};


/* =========================================
   PROFIT REPORT
========================================= */

exports.profitReport = async (req, res) => {
  const [[result]] = await pool.query(
    `SELECT
       (SELECT IFNULL(SUM(total_amount),0) FROM voucher_sale) -
       (SELECT IFNULL(SUM(total_amount),0) FROM voucher_purchase)
       AS profit`
  );

  res.json({
    status: "success",
    data: result
  });
};


/* =========================================
   TODAY PURCHASES
========================================= */

exports.todayPurchases = async (req, res, next) => {
  const [rows] = await pool.query(`
    SELECT 
      p.created_at,
      pr.name AS party,
      p.total_final_amount
    FROM voucher_purchase p
    JOIN parties pr ON pr.id = p.party_id
    WHERE p.created_at >= CURDATE()
      AND p.created_at < CURDATE() + INTERVAL 1 DAY
      AND is_reversed =0
    ORDER BY p.created_at DESC
    LIMIT 10
  `);

  res.json({ status: "success", data: rows });
};


/* =========================================
   TODAY SALES
========================================= */

exports.todaySales = async (req, res, next) => {
  const [rows] = await pool.query(`
    SELECT 
      s.created_at,
      pr.name AS party,
      s.total_amount
    FROM voucher_sale s
    JOIN parties pr ON pr.id = s.party_id
    WHERE s.created_at >= CURDATE()
      AND s.created_at < CURDATE() + INTERVAL 1 DAY
      AND is_reversed =0
    ORDER BY s.created_at DESC
    LIMIT 10
  `);

  res.json({ status: "success", data: rows });
};


/* =========================================
   DASHBOARD COUNTS
========================================= */

exports.dashboardCounts = async (req, res) => {

  const [[purchase]] = await pool.query(`
    SELECT COUNT(*) AS total
    FROM voucher_purchase
    WHERE is_reversed = 0
  `);

  const [[sale]] = await pool.query(`
    SELECT COUNT(*) AS total
    FROM voucher_sale
    WHERE is_reversed = 0
  `);

  res.json({
    status: "success",
    data: {
      purchaseCount: purchase.total,
      saleCount: sale.total
    }
  });
};