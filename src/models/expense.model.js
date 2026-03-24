const pool = require("../config/db");

exports.addExpense = async (data) => {
  return pool.query(
    `INSERT INTO expenses 
    (voucher_no, expense_date, category_id, amount, payment_type, bank_name, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.voucher_no,
      data.expense_date,
      data.category_id,
      data.amount,
      data.payment_type,
      data.bank_name,
      data.remark
    ]
  );
};

exports.getByType = async (type) => {
  return pool.query(
    `SELECT e.*, c.name AS category 
     FROM expenses e
     JOIN expense_categories c ON e.category_id = c.id
     WHERE c.type = ?
     ORDER BY e.expense_date DESC`,
    [type]
  );
};