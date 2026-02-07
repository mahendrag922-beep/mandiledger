const pool = require("../config/db");

exports.createParty = async (data) => {
  const {
    name,
    party_type,
    mobile,
    address,
    opening_balance,
    gstn,
    company_name,
    district,
    state,
    pincode
  } = data;

  // 1️⃣ Duplicate check
  const [[exists]] = await pool.query(
    "SELECT id FROM parties WHERE LOWER(name)=LOWER(?) AND is_active=1",
    [name]
  );

  if (exists) {
    throw new AppError("Party already exists", 400);
  }

  // 2️⃣ Insert party
  const [result] = await pool.query(
  `INSERT INTO parties
   (name, party_type, mobile, address, gstn, company_name, state,district, pincode)
   VALUES (?, ?, ?, ?, ?, ?,?, ?, ?)`,
  [
    name,
    party_type,
    party_type === "farmer" ? mobile || null : null,
    address || null,
    party_type === "mill" ? gstn || null : null,
    party_type === "mill" ? company_name || null : null,
    party_type === "mill" ? state || null : null,
    party_type === "mill" ? district || null : null,
    party_type === "mill" ? pincode || null : null
  ]
);
  return result.insertId;
};

exports.getAllParties = async () => {
  const [rows] = await pool.query("SELECT * FROM parties ORDER BY id DESC");
  return rows;
};
