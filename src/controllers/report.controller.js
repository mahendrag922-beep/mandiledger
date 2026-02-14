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

exports.outstandingReport = async (req, res, next) => {
  const [rows] = await pool.query(`
    SELECT 
      p.id AS party_id,
      p.name,
      p.party_type,
      IFNULL(SUM(l.debit),0) AS total_debit,
      IFNULL(SUM(l.credit),0) AS total_credit,
      (IFNULL(SUM(l.debit),0) - IFNULL(SUM(l.credit),0)) AS balance
    FROM parties p
    LEFT JOIN ledger_entries l ON l.party_id = p.id
    GROUP BY p.id, p.name, p.party_type
    HAVING balance > 0
  `);

  res.json({ status: "success", data: rows });
};

exports.profitReport = async (req, res) => {
  const [[result]] = await pool.query(
    `SELECT
       (SELECT IFNULL(SUM(total_amount),0) FROM sales) -
       (SELECT IFNULL(SUM(total_amount),0) FROM purchases)
       AS profit`
  );

  res.json({
    status: "success",
    data: result
  });
};
exports.todayPurchases = async (req, res, next) => {
  const [rows] = await pool.query(`
    SELECT 
      p.created_at,
      pr.name AS party,
      p.final_amount
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

