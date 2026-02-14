// const pool = require("../config/db");
// const { addLedgerEntry } = require("../utils/ledger.util");
// const Stock = require("../models/stock.model");
// const AppError = require("../utils/AppError");

// exports.createSale = async (req, res, next) => {
//   const { party_id, commodity, quantity, rate } = req.body;
//   const cleanCommodity = commodity.trim().toLowerCase();


//   if (!party_id || !commodity || !quantity || !rate) {
//     return next(new AppError("All sale fields required", 400));
//   }

//   const totalAmount = quantity * rate;
//   const conn = await pool.getConnection();

//   try {
//     await conn.beginTransaction();

//     // 1️⃣ Check stock
//     const [stockRows] = await conn.query(
//   "SELECT quantity FROM stock WHERE LOWER(commodity) = ?",
//   [cleanCommodity]
// );

//     const availableQty = Number(stockRows[0]?.quantity || 0);

// if (availableQty < Number(quantity)) {
//   throw new AppError(
//     `Insufficient stock. Available: ${availableQty} Qtl`,
//     400
//   );
// }


//     // 2️⃣ Save sale
//     const [result] = await conn.query(
//       `INSERT INTO sales
//        (party_id, quantity, rate, total_amount, created_by)
//        VALUES (?, ?, ?, ?, ?)`,
//       [party_id, quantity, rate, totalAmount, req.user.id]
//     );

//     const saleId = result.insertId;

//     // 3️⃣ Ledger entry (CREDIT mill)
//     // 3️⃣ Ledger entry (Mill becomes debtor)
// await addLedgerEntry({
//   partyId: party_id,
//   entryType: "sale",
//   debit: totalAmount,     // ✅ DEBIT mill
//   credit: 0,
//   referenceId: saleId,
//   conn
// });

//     // 4️⃣ Stock OUT
//     await Stock.updateStock({
//   commodity: cleanCommodity,
//   quantity: -quantity,
//   conn
// });

//     await conn.commit();

//     res.status(201).json({
//       status: "success",
//       message: "Sale recorded successfully",
//       totalAmount
//     });

//   } catch (err) {
//     await conn.rollback();
//     next(err);
//   } finally {
//     conn.release();
//   }
// };
const pool = require("../config/db");
const SaleVoucher = require("../models/voucherSale.model");
const { addLedgerEntry, updateLedgerByVoucher } = require("../utils/ledger.util");
const Stock = require("../models/stock.model");
const AppError = require("../utils/AppError");

exports.createSaleVoucher = async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const voucherNo = await SaleVoucher.generateSaleVoucherNo(conn);

    const data = {
      ...req.body,
      voucher_no: voucherNo,
      created_by: req.user.id
    };

    const voucherId = await SaleVoucher.createSaleVoucher(data, conn);

    // 🔥 Ledger (Mill Debit)
    await addLedgerEntry({
      partyId: data.party_id,
      entryType: "sale",
      referenceType:"sale",
      voucherNo: voucherNo,
      debit: data.final_amount,
      credit: 0,
      referenceId: voucherId,
      conn
    });

    // 🔥 Stock Out
    const qtyQuintal = Number(data.final_weight_kg) / 100;

    await Stock.updateStock({
      commodity: data.commodity,
      quantity: -qtyQuintal,
      conn
    });

    await conn.commit();

    res.json({ status: "success" });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
exports.updateSaleVoucher = async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { id } = req.params;

    const [[old]] = await conn.query(
      "SELECT * FROM voucher_sale WHERE id = ?",
      [id]
    );

    if (!old) throw new AppError("Sale voucher not found", 404);

    await SaleVoucher.updateSaleVoucher(id, req.body, conn);
    
    /* 🔥 LEDGER UPDATE (same row) */
    await updateLedgerByVoucher({
      partyId: old.party_id,
      voucherNo: old.voucher_no,
      entryType: "sale_edit",
      referenceType:"sale",
      debit: req.body.final_amount,
      credit: 0,
      conn
    });

    /* 🔥 STOCK DIFF */
    const stockDiff =
      (Number(req.body.final_weight_kg) - Number(old.final_weight_kg)) / 100;

    if (stockDiff !== 0) {
      await Stock.updateStock({
        commodity: req.body.commodity,
        quantity: -stockDiff,
        conn
      });
    }

    await conn.commit();
    res.json({ status: "success" });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
exports.reverseSaleVoucher = async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { id } = req.params;

    const [[voucher]] = await conn.query(
      "SELECT * FROM voucher_sale WHERE id = ?",
      [id]
    );

    if (!voucher) throw new AppError("Sale voucher not found", 404);

    if (voucher.is_reversed)
      throw new AppError("Already reversed", 400);

    await conn.query(
      `UPDATE voucher_sale
       SET is_reversed = 1,
           reversed_at = NOW()
       WHERE id = ?`,
      [id]
    );

    /* 🔥 LEDGER UPDATE */
    await updateLedgerByVoucher({
      partyId: voucher.party_id,
      voucherNo: voucher.voucher_no,
      entryType: "sale_reverse",
      referenceType:"sale",
      debit: 0,
      credit: voucher.final_amount,
      conn
    });

    /* 🔥 RESTORE STOCK */
    const qty = Number(voucher.final_weight_kg) / 100;

    await Stock.updateStock({
      commodity: voucher.commodity,
      quantity: qty,
      conn
    });

    await conn.commit();

    res.json({ status: "success" });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};
