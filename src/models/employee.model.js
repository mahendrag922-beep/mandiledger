const pool = require("../config/db");

exports.addEmployee = async (data) => {

  // Get last employee
  const [rows] = await pool.query(
    `SELECT id FROM employees ORDER BY id DESC LIMIT 1`
  );

  let nextId = 1;

  if(rows.length > 0){
    nextId = rows[0].id + 1;
  }

  const employeeCode = "EMP-" + String(nextId).padStart(4, "0");

  return pool.query(
    `INSERT INTO employees (employee_code, name, mobile, role)
     VALUES (?, ?, ?, ?)`,
    [employeeCode, data.name, data.mobile, data.role]
  );
};
exports.getEmployees = () => {
  return pool.query(
    `SELECT * FROM employees ORDER BY id DESC`
  );
};

exports.getEmployeeById = (id) => {
  return pool.query(
    `SELECT * FROM employees WHERE id = ?`,
    [id]
  );
};

exports.updateEmployee = (id, data) => {
  return pool.query(
    `UPDATE employees 
     SET name = ?, mobile = ?, role = ?
     WHERE id = ?`,
    [data.name, data.mobile, data.role, id]
  );
};

exports.deleteEmployee = (id) => {
  return pool.query(
    `DELETE FROM employees WHERE id = ?`,
    [id]
  );
};