const Employee = require("../models/employee.model");
const Salary = require("../models/salary.model");
const pool = require("../config/db");

exports.addEmployee = async (req, res) => {
  await Employee.addEmployee(req.body);
  res.json({ message: "Employee Added" });
};

exports.getEmployees = async (req, res) => {
  const [rows] = await Employee.getEmployees();
  res.json(rows);
};

exports.updateEmployee = async (req, res) => {
  await Employee.updateEmployee(req.params.id, req.body);
  res.json({ message: "Employee Updated" });
};

exports.deleteEmployee = async (req, res) => {
  await Employee.deleteEmployee(req.params.id);
  res.json({ message: "Employee Deleted" });
};

exports.addSalary = async (req, res) => {

  const {
    employee_id,
    salary_date,
    amount,
    payment_type,
    cash_id,
    bank_id,
    bank_entry_id
  } = req.body;

  const conn = await pool.getConnection();

  try {

    await conn.beginTransaction();

    /* 1️⃣ Generate Salary Voucher */

    const [[last]] = await conn.query(
      `SELECT salary_voucher_no
       FROM salary
       ORDER BY id DESC
       LIMIT 1`
    );

    let voucherNo = "SAL-0001";

    if (last && last.salary_voucher_no) {

      const num =
        parseInt(last.salary_voucher_no.split("-")[1]) + 1;

      voucherNo =
        "SAL-" + String(num).padStart(4, "0");
    }

    /* 2️⃣ Insert Salary */

    /* 2️⃣ Get Bank Name */

let bankName = null;

if (payment_type === "bank") {
  const [[bank]] = await conn.query(
    `SELECT bank_name FROM banks WHERE id=?`,
    [bank_id]
  );

  bankName = bank?.bank_name || null;
}

/* 3️⃣ Get created_by */

let createdBy = "Admin";

if (req.user && req.user.id) {

  const [[user]] = await conn.query(
    `SELECT name FROM users WHERE id=?`,
    [req.user.id]
  );

  if (user) createdBy = user.name;
}

/* 4️⃣ Insert Salary */

await conn.query(
  `INSERT INTO salary
  (salary_voucher_no,
   employee_id,
   salary_date,
   amount,
   payment_type,
   cash_id,
   bank_entry_id,
   bank_id,
   bank_name,
   created_by)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    voucherNo,
    employee_id,
    salary_date,
    amount,
    payment_type,
    payment_type === "cash" ? cash_id : null,
    payment_type === "bank" ? bank_entry_id : null,
    payment_type === "bank" ? bank_id : null,
    bankName,
    createdBy
  ]
);
    /* 3️⃣ CASH PAYMENT */

    if (payment_type === "cash") {

      const [[cash]] = await conn.query(
        `SELECT * FROM cash_entries WHERE cash_id=?`,
        [cash_id]
      );

      if (!cash || cash.remaining_amount < amount)
        throw new Error("Insufficient cash balance");

      await conn.query(
        `UPDATE cash_entries
         SET remaining_amount = remaining_amount - ?
         WHERE cash_id=?`,
        [amount, cash_id]
      );

      await conn.query(
        `INSERT INTO cash_transactions
        (cash_id, party_id, voucher_no, amount, direction)
        VALUES (?, ?, ?, ?, 'debit')`,
        [
          cash_id,
          employee_id,
          voucherNo,
          amount
        ]
      );
    }

    /* 4️⃣ BANK PAYMENT */

    if (payment_type === "bank") {

      const [[entry]] = await conn.query(
        `SELECT * FROM bank_entries WHERE id=?`,
        [bank_entry_id]
      );

      if (!entry || entry.remaining_amount < amount)
        throw new Error("Insufficient bank balance");

      await conn.query(
        `UPDATE bank_entries
         SET remaining_amount = remaining_amount - ?
         WHERE id=?`,
        [amount, bank_entry_id]
      );

      await conn.query(
        `UPDATE banks
         SET balance = balance - ?
         WHERE id=?`,
        [amount, entry.bank_id]
      );

      await conn.query(
        `INSERT INTO bank_transactions
        (bank_entry_id, party_id, voucher_no, amount, type)
        VALUES (?, ?, ?, ?, 'debit')`,
        [
          bank_entry_id,
          employee_id,
          voucherNo,
          amount
        ]
      );
    }

    await conn.commit();

    res.json({
      status: "success",
      voucher: voucherNo
    });

  } catch (err) {

    await conn.rollback();

    console.log("SALARY ERROR:", err);

    res.status(500).json({
      message: err.message
    });

  } finally {
    conn.release();
  }
};
exports.getSalary = async (req, res) => {
  const [rows] = await Salary.getSalary();
  res.json(rows);
};