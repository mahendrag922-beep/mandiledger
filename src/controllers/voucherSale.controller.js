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


    // 🔥 AUTO ADD DRIVER & VEHICLE

    if (req.body.transport_id) {

      const transport_id = req.body.transport_id;
      const driver_name = req.body.driver_name;
      const driver_mobile = req.body.driver_mobile;
      const vehicle_no = req.body.vehicle_no;

      // 1️⃣ Insert driver if not exists
      if (driver_name && driver_mobile) {

        const [[existingDriver]] = await conn.query(
          `SELECT id FROM transport_drivers
       WHERE transport_id=? AND mobile=?`,
          [transport_id, driver_mobile]
        );

        if (!existingDriver) {
          await conn.query(
            `INSERT INTO transport_drivers
         (transport_id, driver_name, mobile)
         VALUES (?,?,?)`,
            [transport_id, driver_name, driver_mobile]
          );
        }
      }

      // 2️⃣ Insert vehicle if not exists
      if (vehicle_no) {

        const [[existingVehicle]] = await conn.query(
          `SELECT id FROM transport_vehicles
       WHERE transport_id=? AND vehicle_no=?`,
          [transport_id, vehicle_no]
        );

        if (!existingVehicle) {
          await conn.query(
            `INSERT INTO transport_vehicles
         (transport_id, vehicle_no, tyres)
         VALUES (?,?,0)`,
            [transport_id, vehicle_no]
          );
        }
      }
    }
    const voucherId = await SaleVoucher.createSaleVoucher(data, conn);

    // 🔥 Ledger (Mill Debit)
    await addLedgerEntry({
      partyId: data.party_id,
      entryType: "sale",
      referenceType: "sale",
      voucherNo: voucherNo,
      debit: data.final_amount,
      credit: 0,
      referenceId: voucherId,
      conn
    });

    // 🔥 GENERATE TRANSPORT VOUCHER NO
    const [[last]] = await conn.query(
      `SELECT transport_voucher_no FROM transport_history
   ORDER BY id DESC LIMIT 1`
    );

    let transportVoucherNo = "TR-0001";

    if (last) {
      const num = parseInt(last.transport_voucher_no.split("-")[1]) + 1;
      transportVoucherNo = "TR-" + String(num).padStart(4, "0");
    }
    // 🔥 TRANSPORT LOGIC

let advance = Number(req.body.freight_advance) || 0;
let totalFreight = Number(req.body.freight_total) || 0;

let remaining = totalFreight - advance;

let status = "not paid";

if (advance > 0 && remaining > 0) {
  status = "partial paid";
}

if (remaining <= 0 && totalFreight > 0) {
  status = "full paid";
}

/* ==============================
   INSERT TRANSPORT HISTORY FIRST
============================== */

const [transportResult] = await conn.query(`
  INSERT INTO transport_history
  (transport_voucher_no, bilty_no,
   transport_id, transport_name,
   driver_name, driver_mobile, vehicle_no,
   sale_voucher_no,
   mill_name, shipping_address,
   rate_per_quintal,
   total_amount,
   advance_payment,
   remaining_payment,
   payment_status,
   remark)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`, [
  transportVoucherNo,
  req.body.bilty_no,
  req.body.transport_id,
  req.body.transport_name,
  req.body.driver_name,
  req.body.driver_mobile,
  req.body.vehicle_no,
  voucherNo,
  req.body.party_name,
  req.body.shipping_address,
  req.body.freight_rate_per_qtl,
  totalFreight,
  advance,
  remaining,
  status,
  req.body.freight_remark
]);

const transportVoucherId = transportResult.insertId;   // ✅ NOW DEFINED

let transportPartyId = null;

if (data.transport_id) {

  const [[transportRow]] = await conn.query(
    "SELECT party_id FROM transports WHERE id=?",
    [data.transport_id]
  );

  if (!transportRow) {
    throw new Error("Transport not found");
  }

  transportPartyId = transportRow.party_id;
}
//transport ledger entry 
if (transportPartyId) {
  await addLedgerEntry({
    partyId: transportPartyId,
    voucherNo: transportVoucherNo,
    receiptNo: null,
    referenceType: "transport",
    entryType: "freight",
    debit: totalFreight,
    credit: 0,
    referenceId: transportVoucherId,
    conn
  });
}
if (advance > 0) {


  /* 💵 CASH */
  if (req.body.freight_payment_type === "cash") {

    const [[cash]] = await conn.query(
      `SELECT * FROM cash_entries WHERE cash_id=?`,
      [req.body.freight_cash_id]
    );

    if (!cash || cash.remaining_amount < advance)
      throw new Error("Insufficient cash balance");

    await conn.query(
      `UPDATE cash_entries
       SET remaining_amount = remaining_amount - ?
       WHERE cash_id=?`,
      [advance, req.body.freight_cash_id]
    );

    await conn.query(
      `INSERT INTO cash_transactions
       (cash_id, party_id, voucher_no, amount, direction)
       VALUES (?,?,?,?, 'debit')`,
      [
        req.body.freight_cash_id,
        transportPartyId,
        transportVoucherNo,
        advance
      ]
    );
  }

  /* 🏦 BANK */
  if (req.body.freight_payment_type === "bank") {

    const [[entry]] = await conn.query(
      `SELECT * FROM bank_entries WHERE id=?`,
      [req.body.freight_bank_entry_id]
    );

    if (!entry || entry.remaining_amount < advance)
      throw new Error("Insufficient bank balance");

    await conn.query(
      `UPDATE bank_entries
       SET remaining_amount = remaining_amount - ?
       WHERE id=?`,
      [advance, req.body.freight_bank_entry_id]
    );

    await conn.query(
      `UPDATE banks
       SET balance = balance - ?
       WHERE id=?`,
      [advance, req.body.freight_bank_id]
    );

    await conn.query(
      `INSERT INTO bank_transactions
       (bank_entry_id, party_id, voucher_no, amount, type)
       VALUES (?,?,?,?, 'debit')`,
      [
        req.body.freight_bank_entry_id,
        transportPartyId,
        transportVoucherNo,
        advance
      ]
    );
  }

  /* ==============================
     INSERT TRANSPORT PAYMENT HISTORY
  ============================== */

  const [[lastPay]] = await conn.query(
    `SELECT payment_no
     FROM transport_payment_history
     ORDER BY id DESC LIMIT 1`
  );

  let paymentNo = "TP-0001";

  if (lastPay) {
    const num = parseInt(lastPay.payment_no.split("-")[1]) + 1;
    paymentNo = "TP-" + String(num).padStart(4, "0");
  }
 
  //transport advace ledger entry 
  await addLedgerEntry({
  partyId: transportPartyId,   // 🔥 transport id
  voucherNo: transportVoucherNo,
  receiptNo: paymentNo,
  referenceType: "transport-payment",
  entryType: "freight-advance",
  debit: 0,
  credit: advance,
  referenceId: transportVoucherId,
  conn
});


  await conn.query(`
    INSERT INTO transport_payment_history
    (transport_id, transport_voucher_no,
     sale_voucher_no, payment_no,
     payment_type, bank_id,
     bank_entry_id, cash_id,
     amount, created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `, [
    req.body.transport_id,
    transportVoucherNo,
    voucherNo,
    paymentNo,
    req.body.freight_payment_type,
    req.body.freight_bank_id || null,
    req.body.freight_bank_entry_id || null,
    req.body.freight_cash_id || null,
    advance,
    req.user?.name || "Admin"
  ]);
}

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
    console.error("SALE CREATE ERROR:", err);  // 🔥 ADD THIS
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
      referenceType: "sale",
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
    await addLedgerEntry({
      partyId: voucher.party_id,
      voucherNo: voucher.voucher_no,
      entryType: "sale_reverse",
      referenceType: "sale",
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
