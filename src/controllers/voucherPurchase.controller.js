const pool = require("../config/db");
const PurchaseVoucher = require("../models/voucherPurchase.model");
const { addLedgerEntry,updateLedgerByVoucher } = require("../utils/ledger.util");
const Stock = require("../models/stock.model");
const AppError = require("../utils/AppError");

exports.createPurchaseVoucher = async (req, res, next) => {
  const conn = await pool.getConnection();
  //console.log("REQ BODY:", req.body);

  try {
    await conn.beginTransaction();

    const { party_id } = req.body;

    // 🔥 FETCH PARTY DETAILS
    const [[party]] = await conn.query(
      "SELECT name, mobile FROM parties WHERE id = ?",
      [party_id]
    );

    if (!party) {
      throw new AppError("Farmer not found", 404);
    }

     const voucherNo = await PurchaseVoucher.generatePurchaseVoucherNo(conn);
  
const data = {
  ...req.body,
  voucher_no: voucherNo,
  party_name: party.name,
  mobile: party.mobile,
  created_by: req.user.id
};

    
    const voucherId = await PurchaseVoucher.createPurchaseVoucher(data, conn);

        // 2️⃣ Ledger entry (DEBIT farmer)
        await addLedgerEntry({
  partyId: party_id,
  voucherNo: data.voucher_no,
  referenceType: "purchase",
  entryType: "purchase",
  debit: data.final_amount,
  credit: 0,
  referenceId: voucherId,
  conn
});
// 4️⃣ Stock IN (convert KG → Quintal)
    const commodity = data.commodity;
    const quantity = Number(data.final_weight_kg) / 100;



        // 3️⃣ Stock IN
        await Stock.updateStock({
          commodity,
      quantity, // ✅ STOCK IN
          conn
        });
    
    

    await conn.commit();

    res.status(201).json({
      status: "success",
      voucherId
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};


exports.updatePurchaseVoucher = async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { id } = req.params;

    const [[old]] = await conn.query(
      "SELECT * FROM voucher_purchase WHERE id = ?",
      [id]
    );

    if (!old) {
      throw new AppError("Voucher not found", 404);
    }

    // 🔥 UPDATE FULL VOUCHER
    await PurchaseVoucher.updatePurchaseVoucher(id, req.body, conn);

      await updateLedgerByVoucher({
  partyId: old.party_id,
  voucherNo: old.voucher_no,
  entryType: "purchase_edit",
  referenceType:"purchase",
  debit: req.body.final_amount,
  credit: 0,
  conn
});

        

    // 📦 STOCK DIFF
    const stockDiff =
      (Number(req.body.final_weight_kg) - Number(old.final_weight_kg)) / 100;

    if (stockDiff !== 0) {
      await Stock.updateStock({
        commodity: req.body.commodity,
        quantity: stockDiff,
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
exports.reversePurchaseVoucher = async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { id } = req.params;

    const [[voucher]] = await conn.query(
      "SELECT * FROM voucher_purchase WHERE id = ?",
      [id]
    );

    if (!voucher) {
      throw new AppError("Voucher not found", 404);
    }

    if (voucher.is_reversed) {
      throw new AppError("Voucher already reversed", 400);
    }

    // 1️⃣ MARK REVERSED
    await conn.query(
      `UPDATE voucher_purchase
       SET is_reversed = 1,
           reversed_at = NOW()
       WHERE id = ?`,
      [id]
    );

    // 2️⃣ LEDGER REVERSAL
    await updateLedgerByVoucher({
  partyId: voucher.party_id,
  voucherNo: voucher.voucher_no,
  entryType: "purchase_reverse",
  referenceType:"purchase",
  debit: 0,
  credit: voucher.final_amount,
  conn
});

    
    // 3️⃣ STOCK OUT (REMOVE PURCHASED STOCK)
    const qtyQuintal = Number(voucher.final_weight_kg) / 100;

    await Stock.updateStock({
      commodity: voucher.commodity,
      quantity: -qtyQuintal,
      conn
    });

    await conn.commit();

    res.json({
      status: "success",
      message: "Purchase voucher reversed safely"
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

