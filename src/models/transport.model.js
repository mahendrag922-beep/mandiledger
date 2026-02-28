const pool = require("../config/db");

exports.createTransport = async (conn, data) => {

  const {
    company_name,
    mobile_primary,
    mobile_alt,
    address,
    district,
    state,
    pincode
  } = data;

  // 1️⃣ CREATE PARTY FIRST
  const [partyResult] = await conn.query(
    `INSERT INTO parties
     (name, party_type, mobile, address, state, district, pincode)
     VALUES (?, 'transport', ?, ?, ?, ?, ?)`,
    [
      company_name,
      mobile_primary || null,
      address || null,
      state || null,
      district || null,
      pincode || null
    ]
  );

  const partyId = partyResult.insertId;

  // 2️⃣ CREATE TRANSPORT WITH PARTY ID
  const [transportResult] = await conn.query(
    `INSERT INTO transports
     (party_id, company_name, mobile_primary, mobile_alt,
      address, district, state, pincode)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      partyId,
      company_name,
      mobile_primary,
      mobile_alt,
      address,
      district,
      state,
      pincode
    ]
  );

  return transportResult.insertId;
};

exports.getAll = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM transports WHERE is_active = 1 ORDER BY id DESC"
  );
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM transports WHERE id = ?",
    [id]
  );
  return rows[0];
};
exports.update = async (id, data) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    // 1️⃣ UPDATE COMPANY
    await conn.query(
  `UPDATE parties SET
   name=?, mobile=?, address=?, state=?, district=?, pincode=?
   WHERE id = (
      SELECT party_id FROM transports WHERE id=?
   )`,
  [
    data.company_name,
    data.mobile_primary,
    data.address,
    data.state,
    data.district,
    data.pincode,
    id
  ]
);
    // 2️⃣ DRIVERS
    for (const d of data.drivers) {
      if (d.id) {
        // 🔁 UPDATE EXISTING → modified_at auto updates
        await conn.query(
          `UPDATE transport_drivers
           SET driver_name=?, mobile=?
           WHERE id=?`,
          [d.driver_name, d.mobile, d.id]
        );
      } else {
        // ➕ NEW DRIVER
        await conn.query(
          `INSERT INTO transport_drivers
           (transport_id, driver_name, mobile)
           VALUES (?, ?, ?)`,
          [id, d.driver_name, d.mobile]
        );
      }
    }

    // 3️⃣ VEHICLES
    for (const v of data.vehicles) {
      if (v.id) {
        await conn.query(
          `UPDATE transport_vehicles
           SET vehicle_no=?, tyres=?
           WHERE id=?`,
          [v.vehicle_no, v.tyres, v.id]
        );
      } else {
        await conn.query(
          `INSERT INTO transport_vehicles
           (transport_id, vehicle_no, tyres)
           VALUES (?, ?, ?)`,
          [id, v.vehicle_no, v.tyres]
        );
      }
    }

    await conn.commit();

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.softDelete = async (id) => {

  const [[row]] = await pool.query(
    "SELECT party_id FROM transports WHERE id=?",
    [id]
  );

  if (!row) return;

  await pool.query(
    "UPDATE parties SET is_active=0 WHERE id=?",
    [row.party_id]
  );

  await pool.query(
    "UPDATE transports SET is_active=0 WHERE id=?",
    [id]
  );
};