const pool = require("../config/db");
const PurchaseVoucher = require("../models/voucherPurchase.model");
const { addLedgerEntry, updateLedgerByVoucher } = require("../utils/ledger.util");
const Stock = require("../models/stock.model");
const AppError = require("../utils/AppError");

exports.createPurchaseVoucher = async (req, res, next) => {

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const {
  purchase_date, // ✅ ADD THIS
  party_id,
  vehicle_no,
  gaddi_no,
  unloading_charge,
  unload_payment_type,
  unload_cash_id,
  unload_bank_id,
  unload_bank_entry_id,
  items
} = req.body;
    

const entryDate = purchase_date
  ? new Date(purchase_date + "T00:00:00")
  : new Date();
    // 🔥 GET PARTY
    const [[party]] = await conn.query(
      `
SELECT name,mobile,gstn,pan,party_type
FROM parties
WHERE id=?
`,
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
  (voucher_no, purchase_date, party_id, party_name,mobile,gst_no,pan_no, vehicle_no,
   total_bags,unloading_charge,gaddi_no, total_weight_kg,total_amount,
   total_wajan_dhalta_kg, total_final_weight_kg,
   total_commission, total_final_amount,
   created_by, created_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`, [
  voucherNo,
  entryDate, // ✅ purchase_date
  party_id,
  party.name,
  party.mobile,
  party.gstn || null,
  party.pan || null,
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
  req.user.id,
  new Date() // ✅ CURRENT DATE ONLY
]);

    const voucherId = header.insertId;
    // 🔥 INSERT ITEMS
    for (const item of items) {

      await conn.query(`
        INSERT INTO voucher_purchase_items
        (voucher_id, commodity,hsn_no, bags,
         total_weight_kg, wajan_dhalta_kg, final_weight_kg,
         rate_per_kg, total_amount,
         commission_percent, commission_amount, final_amount,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
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
        item.final_amount,
        new Date() // ✅ NEW
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
  date: entryDate, // ✅ ADD THIS
  conn
});
    if (unloading_charge > 0) {

      /* DIRECT EXPENSE INSERT */

      const [[lastExp]] = await conn.query(
        `SELECT expense_id FROM expenses
ORDER BY id DESC LIMIT 1`
      );

      let expId = "DEX-0001";

      if (lastExp && lastExp.expense_id) {

        const num =
          parseInt(lastExp.expense_id.split("-")[1]) + 1;

        expId = "DEX-" + String(num).padStart(4, "0");

      }

      /* INSERT EXPENSE */

      let bankName = null;

      if (unload_payment_type === "bank") {

        const [[bank]] = await conn.query(
          `SELECT bank_name FROM banks WHERE id=?`,
          [unload_bank_id]
        );

        bankName = bank?.bank_name || null;

      };

      await conn.query(`
INSERT INTO expenses
(expense_id,expense_type,category_id,expense_date,
voucher_no,gaddi_no,
amount,payment_type,cash_id,bank_entry_id,bank_name,remark)
VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
`,
[
  expId,
  "DIRECT",
  9,
  entryDate, // ✅ FIXED
  voucherNo,
  gaddiNo,
  unloading_charge,
  unload_payment_type,
  unload_payment_type === "cash" ? unload_cash_id : null,
  unload_payment_type === "bank" ? unload_bank_entry_id : null,
  bankName,
  "Unloading Charge Purchase " + voucherNo
]);

      /* CASH PAYMENT */

      if (unload_payment_type === "cash") {

        await conn.query(`
UPDATE cash_entries
SET remaining_amount =
remaining_amount - ?
WHERE cash_id=?
`,
          [unloading_charge, unload_cash_id]);

        await conn.query(`
INSERT INTO cash_transactions
(cash_id,party_id,voucher_no,amount,created_at,direction)
VALUES(?,?,?,?,?, 'debit')
`,
          [
            unload_cash_id,
            party_id,
            expId,
            unloading_charge,
            entryDate
          ]);

      }

      /* BANK PAYMENT */

      if (unload_payment_type === "bank") {

        const [[entry]] =
          await conn.query(
            `SELECT * FROM bank_entries WHERE id=?`,
            [unload_bank_entry_id]
          );

        await conn.query(`
UPDATE bank_entries
SET remaining_amount =
remaining_amount - ?
WHERE id=?
`,
          [unloading_charge, unload_bank_entry_id]);

        await conn.query(`
UPDATE banks
SET balance = balance - ?
WHERE id=?
`,
          [unloading_charge, entry.bank_id]);

        await conn.query(`
INSERT INTO bank_transactions
(bank_entry_id,party_id,voucher_no,amount,created_at,type)
VALUES(?,?,?,?, 'debit')
`,
          [
            unload_bank_entry_id,
            party_id,
            expId,
            unloading_charge,
            entryDate
          ]);

      }

    };

    /* ===============================
 MANDI COMMISSION INSERT
 ================================ */

    if (totalCommission > 0) {

      const [[last]] = await conn.query(`
SELECT commission_id
FROM mandi_commission
ORDER BY id DESC
LIMIT 1
`);

      let commissionId = "MC-0001";

      if (last && last.commission_id) {

        const num =
          parseInt(last.commission_id.split("-")[1]) + 1;

        commissionId =
          "MC-" + String(num).padStart(4, "0");

      }

      await conn.query(`
INSERT INTO mandi_commission
(commission_id,
voucher_no,
gaddi_no,
party_id,
party_name,
commission_percent,
commission_amount,
total_amount,created_at)

VALUES(?,?,?,?,?,?,?,?,?)
`,
        [
          commissionId,
          voucherNo,
          gaddiNo,
          party_id,
          party.name,
          items[0].commission_percent,
          totalCommission,
          totalFinalAmount,
          entryDate
        ]);

    };

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


exports.getPurchaseItemsByVoucherNo = async (req,res)=>{

const [rows] = await pool.query(`
SELECT
i.commodity,
i.hsn_no,
i.bags,
i.total_weight_kg,
i.final_weight_kg,
i.rate_per_kg,
i.final_amount
FROM voucher_purchase_items i
JOIN voucher_purchase v
ON v.id = i.voucher_id
WHERE v.voucher_no = ?
`,[req.params.voucherNo]);

res.json({
status:"success",
data:rows
});
};