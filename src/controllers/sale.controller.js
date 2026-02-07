const pool = require("../config/db");
const { addLedgerEntry } = require("../utils/ledger.util");
const Stock = require("../models/stock.model");
const AppError = require("../utils/AppError");

exports.createSale = async (req, res, next) => {
  const { party_id, commodity, quantity, rate } = req.body;
  const cleanCommodity = commodity.trim().toLowerCase();


  if (!party_id || !commodity || !quantity || !rate) {
    return next(new AppError("All sale fields required", 400));
  }

  const totalAmount = quantity * rate;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Check stock
    const [stockRows] = await conn.query(
  "SELECT quantity FROM stock WHERE LOWER(commodity) = ?",
  [cleanCommodity]
);

    const availableQty = Number(stockRows[0]?.quantity || 0);

if (availableQty < Number(quantity)) {
  throw new AppError(
    `Insufficient stock. Available: ${availableQty} Qtl`,
    400
  );
}


    // 2️⃣ Save sale
    const [result] = await conn.query(
      `INSERT INTO sales
       (party_id, quantity, rate, total_amount, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [party_id, quantity, rate, totalAmount, req.user.id]
    );

    const saleId = result.insertId;

    // 3️⃣ Ledger entry (CREDIT mill)
    // 3️⃣ Ledger entry (Mill becomes debtor)
await addLedgerEntry({
  partyId: party_id,
  entryType: "sale",
  debit: totalAmount,     // ✅ DEBIT mill
  credit: 0,
  referenceId: saleId,
  conn
});

    // 4️⃣ Stock OUT
    await Stock.updateStock({
  commodity: cleanCommodity,
  quantity: -quantity,
  conn
});

    await conn.commit();

    res.status(201).json({
      status: "success",
      message: "Sale recorded successfully",
      totalAmount
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
