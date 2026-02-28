const pool = require("../config/db");
const PurchaseVoucher = require("../models/voucherPurchase.model");
const { addLedgerEntry,updateLedgerByVoucher } = require("../utils/ledger.util");
const Stock = require("../models/stock.model");
const AppError = require("../utils/AppError");

exports.createPurchaseVoucher = async (req, res, next) => {

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const { party_id, vehicle_no, gaddi_no, unloading_charge, items } = req.body;
    //console.log(req.body);
    // 🔥 GET PARTY
    const [[party]] = await conn.query(
      "SELECT name,mobile FROM parties WHERE id=?",
      [party_id]
    );

    if (!party) throw new Error("Farmer not found");

    // 🔥 GENERATE VOUCHER NO
    const voucherNo = await PurchaseVoucher.generatePurchaseVoucherNo(conn);

    // 🔥 CALCULATE TOTALS
    let totalBags = 0;
    const totalUnloadingCharge = Number(unloading_charge) || 0;
    const gaddiNo = gaddi_no || "";
    let totalWeight = 0;
    let totalAmount = 0;
    let totalDhalta = 0;
    let totalFinalWeight = 0;
    let totalCommission = 0;
    let totalFinalAmount = 0;

    items.forEach(item => {

  totalBags += Number(item.bags) || 0;
  totalWeight += Number(item.total_weight_kg) || 0;
  totalAmount += Number(item.total_amount) || 0;
  totalDhalta += Number(item.wajan_dhalta_kg) || 0;
  totalFinalWeight += Number(item.final_weight_kg) || 0;
  totalCommission += Number(item.commission_amount) || 0;

  // ✅ Correct summing
  totalFinalAmount += Number(item.final_amount) || 0;
});

totalFinalAmount = totalFinalAmount - totalUnloadingCharge;
    // 🔥 INSERT HEADER
    const [header] = await conn.query(`
      INSERT INTO voucher_purchase
      (voucher_no, party_id, party_name,mobile, vehicle_no,
       total_bags,unloading_charge,gaddi_no, total_weight_kg,total_amount,
       total_wajan_dhalta_kg, total_final_weight_kg,
       total_commission, total_final_amount,
       created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      voucherNo,
      party_id,
      party.name,
      party.mobile,
      vehicle_no,
      totalBags,
      totalUnloadingCharge,
      gaddiNo,
      totalWeight,
      totalAmount,
      totalDhalta,
      totalFinalWeight,
      totalCommission,
      totalFinalAmount,
      req.user.id
    ]);

const voucherId = header.insertId;
    // 🔥 INSERT ITEMS
    for (const item of items) {

      await conn.query(`
        INSERT INTO voucher_purchase_items
        (voucher_id, commodity,hsn_no, bags,
         total_weight_kg, wajan_dhalta_kg, final_weight_kg,
         rate_per_kg, total_amount,
         commission_percent, commission_amount, final_amount)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        voucherId,
        item.commodity,
        item.hsn_no,
        item.bags,
        item.total_weight_kg,
        item.wajan_dhalta_kg,
        item.final_weight_kg,
        item.rate_per_kg,
        item.total_amount,
        item.commission_percent,
        item.commission_amount,
        item.final_amount
      ]);

      // 🔥 STOCK UPDATE
      await Stock.updateStock({
        commodity: item.commodity,
        quantity: item.final_weight_kg / 100,
        conn
      });
    }

    // 🔥 LEDGER ENTRY
    await addLedgerEntry({
      partyId: party_id,
      voucherNo,
      entryType: "purchase",
      referenceType: "purchase",
      debit: totalFinalAmount,
      credit: 0,
      referenceId: voucherId,
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
exports.updatePurchaseVoucher = async (req, res, next) => {

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
  
    const { id } = req.params;
    const { item_id, itemData } = req.body;

    // 1️⃣ GET HEADER
    const [[header]] = await conn.query(
      "SELECT * FROM voucher_purchase WHERE id=?",
      [id]
    );

    if (!header) throw new Error("Voucher not found");

    // 2️⃣ GET OLD ITEM (for stock difference)
    const [[oldItem]] = await conn.query(
      "SELECT * FROM voucher_purchase_items WHERE id=?",
      [item_id]
    );

    if (!oldItem) throw new Error("Item not found");

    // 3️⃣ UPDATE ITEM
    await conn.query(`
      UPDATE voucher_purchase_items
      SET bags=?,
          total_weight_kg=?,
          wajan_dhalta_kg=?,
          final_weight_kg=?,
          rate_per_kg=?,
          total_amount=?,
          commission_percent=?,
          commission_amount=?,
          final_amount=?
      WHERE id=?
    `, [
      itemData.bags,
      itemData.total_weight_kg,
      itemData.wajan_dhalta_kg,
      itemData.final_weight_kg,
      itemData.rate_per_kg,
      itemData.total_amount,
      itemData.commission_percent,
      itemData.commission_amount,
      itemData.final_amount,
      item_id
    ]);

    // 4️⃣ STOCK DIFFERENCE
    const stockDiff =
      (itemData.final_weight_kg - oldItem.final_weight_kg) / 100;

    if (stockDiff !== 0) {
      await Stock.updateStock({
        commodity: oldItem.commodity,
        quantity: stockDiff,
        conn
      });
    }

    // 5️⃣ RECALCULATE HEADER TOTALS
    const [items] = await conn.query(
      "SELECT * FROM voucher_purchase_items WHERE voucher_id=?",
      [id]
    );

    let totalBags = 0;
    let totalWeight = 0;
    let totalAmount = 0;
    let totalDhalta = 0;
    let totalFinalWeight = 0;
    let totalCommission = 0;
    let totalFinalAmount = 0;

    items.forEach(item => {
  totalBags += Number(item.bags);
  totalWeight += Number(item.total_weight_kg);
  totalAmount += Number(item.total_amount);
  totalDhalta += Number(item.wajan_dhalta_kg);
  totalFinalWeight += Number(item.final_weight_kg);
  totalCommission += Number(item.commission_amount);
  totalFinalAmount += Number(item.final_amount);
});
    // 6️⃣ UPDATE HEADER
    await conn.query(`
      UPDATE voucher_purchase
      SET total_bags=?,
          total_weight_kg=?,
          total_amount=?,
          total_wajan_dhalta_kg=?,
          total_final_weight_kg=?,
          total_commission=?,
          total_final_amount=?,
          modified_at=NOW()
      WHERE id=?
    `, [
      totalBags,
      totalWeight,
      totalAmount,
      totalDhalta,
      totalFinalWeight,
      totalCommission,
      totalFinalAmount,
      id
    ]);

    // 7️⃣ LEDGER UPDATE
    await updateLedgerByVoucher({
      partyId: header.party_id,
      voucherNo: header.voucher_no,
      entryType: "purchase_edit",
      referenceType: "purchase",
      debit: totalFinalAmount,
      credit: 0,
      conn
    });

    await conn.commit();

    res.json({ status: "success" });

  } catch (err) {
  console.error("UPDATE ERROR:", err);
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

    // 1️⃣ Get header
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

    // 2️⃣ Get all items
    const [items] = await conn.query(
      "SELECT * FROM voucher_purchase_items WHERE voucher_id = ?",
      [id]
    );

    if (!items.length) {
      throw new AppError("No items found for this voucher", 400);
    }

    // 3️⃣ Reverse stock for EACH item
    for (const item of items) {
      const qtyQuintal = Number(item.final_weight_kg) / 100;

      await Stock.updateStock({
        commodity: item.commodity,
        quantity: -qtyQuintal,   // subtract stock
        conn
      });
    }

    // 4️⃣ Ledger reversal (reverse full amount)
    await addLedgerEntry({
      partyId: voucher.party_id,
      voucherNo: voucher.voucher_no,
      entryType: "purchase_reverse",
      referenceType: "purchase",
      debit: 0,
      credit: voucher.total_final_amount,
      referenceId: voucher.id,
      conn
    });

    // 5️⃣ Mark header reversed
    await conn.query(
      `UPDATE voucher_purchase
       SET is_reversed = 1,
           reversed_at = NOW()
       WHERE id = ?`,
      [id]
    );

    await conn.commit();

    res.json({
      status: "success",
      message: "Purchase voucher reversed successfully"
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.getPurchaseItems = async (req, res) => {

  const { id } = req.params;

  const [items] = await pool.query(
    `SELECT * FROM voucher_purchase_items
     WHERE voucher_id = ?`,
    [id]
  );

  res.json({
    status: "success",
    data: items
  });
};
