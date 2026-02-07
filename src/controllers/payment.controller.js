const pool = require("../config/db");
const { addLedgerEntry } = require("../utils/ledger.util");
const AppError = require("../utils/AppError");

exports.addPayment = async (req, res, next) => {
  const { party_id, amount, payment_type, direction } = req.body;

  if (!party_id || !amount || !payment_type || !direction) {
    return next(new AppError("All payment fields required", 400));
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Save payment
    const [result] = await conn.query(
      `INSERT INTO payments
       (party_id, amount, payment_type, direction, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [party_id, amount, payment_type, direction, req.user.id]
    );

    // 2️⃣ LEDGER UPDATE (THIS IS KEY)
    if (direction === "paid") {
      // Trader pays farmer → reduce payable (credit)
      await addLedgerEntry({
        partyId: party_id,
        entryType: "payment-paid",
        debit: 0,
        credit: amount,
        referenceId: result.insertId,
        conn
      });
    } else {
      // Mill pays trader → reduce receivable (debit)
      await addLedgerEntry({
        partyId: party_id,
        entryType: "payment-received",
        debit: 0,
        credit: amount,
        referenceId: result.insertId,
        conn
      });
    }

    await conn.commit();

    res.json({
      status: "success",
      message: "Payment saved & ledger updated"
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
