const pool = require("../config/db");
const { addLedgerEntry } = require("../utils/ledger.util");
const Stock = require("../models/stock.model");
const AppError = require("../utils/AppError");

exports.createPurchase = async (req, res, next) => {
  const { party_id, commodity, quantity, rate } = req.body;

  if (!party_id || !commodity || !quantity || !rate) {
    return next(new AppError("All purchase fields required", 400));
  }

  const totalAmount = quantity * rate;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Save purchase
    const [result] = await conn.query(
      `INSERT INTO purchases
       (party_id, quantity, rate, total_amount, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [party_id, quantity, rate, totalAmount, req.user.id]
    );

    const purchaseId = result.insertId;

    // 2️⃣ Ledger entry (DEBIT farmer)
    await addLedgerEntry({
      partyId: party_id,
      entryType: "purchase",
      debit: totalAmount,
      credit: 0,
      referenceId: purchaseId,
      conn
    });

    // 3️⃣ Stock IN
    await Stock.updateStock({
      commodity,
      quantity,
      conn
    });

    await conn.commit();

    res.status(201).json({
      status: "success",
      message: "Purchase added successfully",
      totalAmount
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
