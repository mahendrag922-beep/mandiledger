const pool = require("../config/db");



exports.getSalary = async () => {

  return pool.query(`
    SELECT
      s.salary_voucher_no,
      e.employee_code,
      e.name,
      s.salary_date,
      s.amount,
      s.payment_type,
      s.cash_id,
      s.bank_name,
      s.bank_entry_id,
      s.created_by
    FROM salary s
    LEFT JOIN employees e
      ON s.employee_id = e.id
    ORDER BY s.id DESC
  `);

};