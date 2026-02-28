const pool = require("../config/db");
const{addLedgerEntry} = require("../utils/ledger.util");
const VoucherPaymentController =
  require("./voucherPayment.controller");

const VoucherReceiptController =
  require("./voucherReceipt.controller");


  async function handleOutgoingPayment({
  conn,
  party_id,
  voucher_no,
  amount,
  payment_type,
  source_id,
  bank_id
}) {

  if (payment_type === "cash") {

    const [[cash]] = await conn.query(
      `SELECT * FROM cash_entries WHERE cash_id=?`,
      [source_id]
    );

    if (!cash || cash.remaining_amount < amount)
      throw new Error("Insufficient cash balance");

    await conn.query(
      `UPDATE cash_entries
       SET remaining_amount = remaining_amount - ?
       WHERE cash_id=?`,
      [amount, source_id]
    );

    await conn.query(
      `INSERT INTO cash_transactions
       (cash_id, party_id, voucher_no, amount, direction)
       VALUES (?, ?, ?, ?, 'debit')`,
      [source_id, party_id, voucher_no, amount]
    );
  }

  if (payment_type === "bank") {

    const [[entry]] = await conn.query(
      `SELECT * FROM bank_entries WHERE id=?`,
      [source_id]
    );

    if (!entry || entry.remaining_amount < amount)
      throw new Error("Insufficient bank balance");

    await conn.query(
      `UPDATE bank_entries
       SET remaining_amount = remaining_amount - ?
       WHERE id=?`,
      [amount, source_id]
    );

    await conn.query(
      `UPDATE banks
       SET balance = balance - ?
       WHERE id=?`,
      [amount, bank_id]
    );

    await conn.query(
      `INSERT INTO bank_transactions
       (bank_entry_id, party_id, voucher_no, amount, type)
       VALUES (?, ?, ?, ?, 'debit')`,
      [source_id, party_id, voucher_no, amount]
    );
  }
}

exports.addPayment = async (req, res) => {

  const {
    party_id,
    party_name,
    voucher_no,
    amount,
    payment_type,
    direction,
    source_id,
    bank_id,
    case_discount = 0,
    weight_shortage = 0,
    unloading_charges = 0,
    brokerage_commission = 0,
    quality_claim = 0,
    bank_charges = 0
  } = req.body;

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
   
    let createdBy = "Admin";

if (req.user && req.user.id) {
  const [[user]] = await conn.query(
    `SELECT name FROM users WHERE id = ?`,
    [req.user.id]
  );

  if (user?.name) {
    createdBy = user.name;
  }
}


    const [[party]] = await conn.query(
      `SELECT * FROM parties WHERE id=?`,
      [party_id]
    );

    if (!party) throw new Error("Party not found");

    const partyType = party.party_type;

    let bank = null;
    if (bank_id) {
      const [[bankRow]] = await conn.query(
        `SELECT * FROM banks WHERE id=?`,
        [bank_id]
      );
      bank = bankRow;
    }

    /* ===================================================== */
    /* 🔵 MILL RECEIPT */
    /* ===================================================== */

    if (partyType === "mill" && direction === "received") {

      const totalDeductions =
        Number(case_discount) +
        Number(weight_shortage) +
        Number(unloading_charges) +
        Number(brokerage_commission) +
        Number(quality_claim) +
        Number(bank_charges);

      const finalReceivedAmount =
        Number(amount) - totalDeductions;

      if (!bank_id) throw new Error("Select bank");

      await conn.query(
        `UPDATE banks SET balance = balance + ? WHERE id=?`,
        [finalReceivedAmount, bank_id]
      );

      await conn.query(
        `INSERT INTO bank_entries
         (bank_id, voucher_no, mill_name, total_amount, remaining_amount)
         VALUES (?, ?, ?, ?, ?)`,
        [bank_id, voucher_no, party_name, finalReceivedAmount, finalReceivedAmount]
      );

      const receiptNo =
        await VoucherReceiptController.createVoucherReceipt({
          mill: party,
          saleVoucherNo: voucher_no,
          bankName: bank.bank_name,
          amount,
          final_received_amount: finalReceivedAmount,
          createdBy: "Admin",
          conn
        });

      await addLedgerEntry({
        partyId: party_id,
        voucherNo: voucher_no,
        receiptNo: receiptNo,
        referenceType: "receipt",
        entryType: "payment-received",
        debit: 0,
        credit: amount,
        conn
      });
    }

    /* ===================================================== */
    /* 🔴 FARMER PAYMENT */
    /* ===================================================== */

    else if (partyType === "farmer" && direction === "paid") {

      await handleOutgoingPayment({
        conn,
        party_id,
        voucher_no,
        amount,
        payment_type,
        source_id,
        bank_id
      });

      const paymentNo =
        await VoucherPaymentController.createVoucherPayment({
          party,
          purchaseVoucherNo: voucher_no,
          paymentType: payment_type,
          amount,
          createdBy: "Admin",
          conn
        });

      await addLedgerEntry({
        partyId: party_id,
        voucherNo: voucher_no,
        receiptNo: paymentNo,
        referenceType: "payment",
        entryType: "payment-paid",
        debit: 0,
        credit: amount,
        conn
      });
    }

    
    /* ===================================================== */
/* 🚛 TRANSPORT PAYMENT */
/* ===================================================== */

else if (partyType === "transport" && direction === "paid") {

  // 1️⃣ Get voucher
  const [[history]] = await conn.query(
    `SELECT total_amount, remaining_payment
     FROM transport_history
     WHERE transport_voucher_no=?`,
    [voucher_no]
  );

  if (!history)
    throw new Error("Transport voucher not found");

  if (amount > history.remaining_payment)
    throw new Error("Payment exceeds remaining amount");

  // 2️⃣ Deduct from cash/bank
  await handleOutgoingPayment({
    conn,
    party_id,
    voucher_no,
    amount,
    payment_type,
    source_id,
    bank_id
  });

  // 3️⃣ Generate payment no
  const [[lastPay]] = await conn.query(
    `SELECT payment_no
     FROM transport_payment_history
     ORDER BY id DESC LIMIT 1`
  );

  let paymentNo = "TP-0001";

  if (lastPay) {
    const num =
      parseInt(lastPay.payment_no.split("-")[1]) + 1;
    paymentNo = "TP-" + String(num).padStart(4, "0");
  }

  // 4️⃣ Insert history
  await conn.query(`
    INSERT INTO transport_payment_history
    (transport_id,
     transport_voucher_no,
     payment_no,
     payment_type,
     bank_id,
     bank_entry_id,
     cash_id,
     amount,
     created_by)
    VALUES (?,?,?,?,?,?,?,?,?)
  `, [
    party_id,
    voucher_no,
    paymentNo,
    payment_type,
    bank_id || null,
    payment_type === "bank" ? source_id : null,
    payment_type === "cash" ? source_id : null,
    amount,
    createdBy
  ]);

  // 5️⃣ Update remaining
  const newRemaining =
    history.remaining_payment - amount;

  let newStatus =
    newRemaining <= 0
      ? "full paid"
      : "partial paid";

  await conn.query(
    `UPDATE transport_history
     SET remaining_payment=?,
         payment_status=?
     WHERE transport_voucher_no=?`,
    [Math.max(newRemaining, 0), newStatus, voucher_no]
  );

  // 6️⃣ Ledger
  await addLedgerEntry({
    partyId: party_id,
    voucherNo: voucher_no,
    receiptNo: paymentNo,
    referenceType: "transport-payment",
    entryType: "freight-payment",
    debit: 0,
    credit: amount,
    conn
  });
}
    else {
      throw new Error("Invalid payment type/direction");
    }

    await conn.commit();
    res.json({ status: "success" });

  } catch (err) {

    await conn.rollback();
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ error: err.message });

  } finally {
    conn.release();
  }
};