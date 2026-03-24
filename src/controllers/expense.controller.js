const Expense = require("../models/expense.model");
const Salary = require("../models/salary.model");
//const pdfParse = require("pdf-parse");
const fs = require("fs");
const pool = require("../config/db");


exports.addExpense = async (req, res) => {

  const conn = await pool.getConnection();

  try {

    await conn.beginTransaction();

    const {
      category_id,
      expense_date,
      amount,
      payment_type,
      cash_id,
      bank_id,
      bank_entry_id,
      remark
    } = req.body;

    /* 1️⃣ Generate Expense ID */

    const [[last]] = await conn.query(`
      SELECT expense_id
      FROM expenses
      ORDER BY id DESC
      LIMIT 1
    `);

    let expenseId = "EXP-0001";

    if (last && last.expense_id) {

      const num =
        parseInt(last.expense_id.split("-")[1]) + 1;

      expenseId =
        "EXP-" + String(num).padStart(4, "0");
    }

    /* 2️⃣ Get Bank Name */

    let bankName = null;

    if (payment_type === "bank") {

      const [[bank]] = await conn.query(
        `SELECT bank_name FROM banks WHERE id=?`,
        [bank_id]
      );

      bankName = bank?.bank_name || null;
    }
    

    const [[category]] = await conn.query(
`SELECT category_code,name
 FROM expense_categories
 WHERE id=?`,
[category_id]
);

if(!category)
throw new Error("Category not found");
    /* 3️⃣ Insert Expense */

    await conn.query(
      `INSERT INTO expenses
      (expense_id, category_id, expense_date,
       amount, payment_type, cash_id,
       bank_entry_id, bank_name, remark, created_by)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expenseId,
        category_id,
        expense_date,
        amount,
        payment_type,
        payment_type === "cash" ? cash_id : null,
        payment_type === "bank" ? bank_entry_id : null,
        bankName,
        remark,
        "Admin"
      ]
    );
await conn.query(
`UPDATE expense_categories
 SET total = COALESCE(total,0) + ?
 WHERE id = ?`,
[Number(amount), Number(category_id)]
);
    /* =============================
       CASH PAYMENT
    ============================= */

    if (payment_type === "cash") {

      const [[cash]] = await conn.query(
        `SELECT * FROM cash_entries
         WHERE cash_id=?`,
        [cash_id]
      );

      if (!cash || cash.remaining_amount < amount)
        throw new Error("Insufficient cash balance");

      /* Update Cash Balance */

      await conn.query(
        `UPDATE cash_entries
         SET remaining_amount =
         remaining_amount - ?
         WHERE cash_id=?`,
        [amount, cash_id]
      );

      /* Cash History */

     await conn.query(
`INSERT INTO cash_transactions
(cash_id, party_id, voucher_no, amount, direction)
VALUES (?, ?, ?, ?, 'debit')`,
[
  cash_id,
  category.category_code,
  expenseId,
  amount
]
);
    }

    /* =============================
       BANK PAYMENT
    ============================= */

    if (payment_type === "bank") {

      const [[entry]] = await conn.query(
        `SELECT * FROM bank_entries
         WHERE id=?`,
        [bank_entry_id]
      );

      if (!entry || entry.remaining_amount < amount)
        throw new Error("Insufficient bank balance");

      /* Update Bank Entry */

      await conn.query(
        `UPDATE bank_entries
         SET remaining_amount =
         remaining_amount - ?
         WHERE id=?`,
        [amount, bank_entry_id]
      );

      /* Update Bank Balance */

      await conn.query(
        `UPDATE banks
         SET balance = balance - ?
         WHERE id=?`,
        [amount, entry.bank_id]
      );

      /* Bank Transaction */

      await conn.query(
`INSERT INTO bank_transactions
(bank_entry_id, party_id, voucher_no, amount, type)
VALUES (?, ?, ?, ?, 'debit')`,
[
  bank_entry_id,
  category.category_code,
  expenseId,
  amount
]
);
    }

    await conn.commit();

    res.json({
      status: "success",
      expense: expenseId
    });

  } catch (err) {

    await conn.rollback();

    console.log("EXPENSE ERROR:", err);

    res.status(500).json({
      message: err.message
    });

  } finally {

    conn.release();

  }
};

exports.getExpenseByType = async (req, res) => {
  const [rows] = await Expense.getByType(req.params.type);
  res.json(rows);
};


exports.getExpenseCategories = async (req, res) => {

  const [rows] = await pool.query(`
    SELECT id, name
    FROM expense_categories
    WHERE UPPER(type) = 'INDIRECT'
    ORDER BY name
  `);

  res.json(rows);

};

exports.getIndirectTotals = async (req, res) => {

  const [rows] = await pool.query(`
    SELECT 
category_code,
name AS category_name,
total
FROM expense_categories
WHERE UPPER(type)='INDIRECT'
ORDER BY name
  `);

  res.json(rows);

};

// exports.uploadBankPDF = async (req, res) => {
//   const dataBuffer = fs.readFileSync(req.file.path);
//   const data = await pdfParse(dataBuffer);

//   const text = data.text.toUpperCase();
//   const lines = text.split("\n");

//   for (let line of lines) {
//     if (line.includes("CHARGE") || line.includes("INT")) {
//       const amountMatch = line.match(/(\d+\.\d+)/);
//       if (amountMatch) {
//         await Expense.addExpense({
//           voucher_no: "FIN-" + Date.now(),
//           expense_date: new Date(),
//           category_id: 1,
//           amount: amountMatch[0],
//           payment_type: "bank",
//           bank_name: "Auto Import",
//           remark: line
//         });
//       }
//     }
//   }

//   res.json({ message: "Bank Charges Imported" });
// };

exports.getDirectExpenses = async (req,res)=>{

const [rows] = await pool.query(`

SELECT 
e.expense_id,
c.name as category,
DATE(e.expense_date) as expense_date,
e.voucher_no,
e.gaddi_no,
e.amount,
e.payment_type,
e.cash_id,
e.bank_name,
e.bank_entry_id,
e.remark

FROM expenses e

LEFT JOIN expense_categories c
ON e.category_id=c.id

WHERE e.expense_type='DIRECT'

ORDER BY e.id DESC

`);

res.json(rows);

};


exports.getMandiCommission = async (req,res)=>{

try{

const [rows] = await pool.query(`
SELECT 
commission_id,
voucher_no,
gaddi_no,
party_name,
commission_percent,
commission_amount,
total_amount
FROM mandi_commission
ORDER BY id DESC
`);

//console.log("MANDI DATA:", rows);

res.json(rows);

}catch(err){

console.log(err);

res.status(500).json({
message:err.message
});

}

};

exports.getMillAdjustmentDetails = async (req,res)=>{

const voucherNo = req.params.voucher_no;

const [rows] = await pool.query(`
SELECT
case_discount,
weight_shortage,
unloading_charges,
brokerage_commission,
quality_claim,
bank_charges
FROM voucher_receipt
WHERE sale_voucher_no = ?
LIMIT 1
`,[voucherNo]);

res.json(rows[0] || {});

};

exports.getMillDeductionAnalytics = async (req,res)=>{

const [rows] = await pool.query(`

SELECT
mill_name,

SUM(amount) AS total_sales,

SUM(
case_discount +
weight_shortage +
unloading_charges +
brokerage_commission +
quality_claim +
transport_charges +
bank_charges
) AS total_deduction

FROM voucher_receipt

GROUP BY mill_name
ORDER BY total_deduction DESC

`);

rows.forEach(r=>{

const percent =
(Number(r.total_deduction)/Number(r.total_sales))*100;

r.deduction_percent = percent.toFixed(2);

});

res.json(rows);

};

exports.getMillBreakdown = async (req,res)=>{

const mill = req.params.mill;

const [rows] = await pool.query(`

SELECT
sale_voucher_no,
amount,
case_discount,
weight_shortage,
unloading_charges,
brokerage_commission,
quality_claim,
transport_charges,
bank_charges,

(
case_discount +
weight_shortage +
unloading_charges +
brokerage_commission +
quality_claim +
transport_charges +
bank_charges
) AS deduction

FROM voucher_receipt

WHERE mill_name = ?

ORDER BY created_at DESC

`,[mill]);

rows.forEach(r=>{

r.percent = (
(Number(r.deduction)/Number(r.amount))*100
).toFixed(2);

});

res.json(rows);

};

exports.getDirectExpenseTotals = async (req,res)=>{

const [rows] = await pool.query(`

SELECT
id,
name,
category_code,
total

FROM expense_categories

WHERE type='direct'

AND name IN (
'Unloading Charge',
'Mill Adjustment',
'Transport Charge'
)

ORDER BY name

`);

res.json(rows);

};


exports.getDirectExpenseByCategory = async (req,res)=>{

const category = req.params.category;

const [rows] = await pool.query(`

SELECT
e.expense_id,
c.name as category,
DATE(e.expense_date) as expense_date,
e.voucher_no,
e.gaddi_no,
e.amount,
e.payment_type,
e.cash_id,
e.bank_name,
e.bank_entry_id

FROM expenses e

LEFT JOIN expense_categories c
ON e.category_id = c.id

WHERE e.expense_type='DIRECT'
AND c.name = ?

ORDER BY e.id DESC

`,[category]);

res.json(rows);

};

exports.getExpenseDashboard = async (req,res)=>{

try{

const [[direct]] = await pool.query(`
SELECT COALESCE(SUM(amount),0) AS total
FROM expenses
WHERE expense_type='DIRECT'
`);

const [[indirect]] = await pool.query(`
SELECT COALESCE(SUM(amount),0) AS total
FROM expenses
WHERE expense_type='INDIRECT'
`);

const [[commission]] = await pool.query(`
SELECT COALESCE(SUM(commission_amount),0) AS total
FROM mandi_commission
`);

res.json({
direct: direct.total,
indirect: indirect.total,
commission: commission.total
});

}catch(err){

console.log(err);

res.status(500).json({
message: err.message
});

}

};