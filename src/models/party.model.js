const pool = require("../config/db");
const AppError = require("../utils/AppError");
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
(name, party_type, mobile, address, gstn, pan, company_name, state, district, pincode)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
[
  name,
  party_type,

  // mobile
  party_type === "farmer" || party_type === "trader"
    ? mobile || null
    : null,

  // address
  address || null,

  // gst
  party_type === "mill" || party_type === "trader"
    ? gstn || null
    : null,

  // pan
  party_type === "trader"
    ? data.pan || null
    : null,

  // company
  party_type === "mill" || party_type === "trader"
    ? company_name || null
    : null,

  // state
  party_type === "mill" || party_type === "trader"
    ? state || null
    : null,

  // district
  party_type === "mill" || party_type === "trader"
    ? district || null
    : null,

  // pincode
  party_type === "mill" || party_type === "trader"
    ? pincode || null
    : null
]
);
  return result.insertId;
};

exports.getAllParties = async () => {
  const [rows] = await pool.query("SELECT * FROM parties ORDER BY id DESC");
  return rows;
};
