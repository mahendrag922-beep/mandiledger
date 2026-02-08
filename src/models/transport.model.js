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

  const [result] = await conn.query(
    `INSERT INTO transports
     (company_name, mobile_primary, mobile_alt, address, district, state, pincode)
     VALUES (?,?,?,?,?,?,?)`,
    [company_name, mobile_primary, mobile_alt, address, district, state, pincode]
  );

  return result.insertId;
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
      `UPDATE transports SET
       company_name=?, mobile_primary=?, mobile_alt=?, address=?,
       district=?, state=?, pincode=?
       WHERE id=?`,
      [
        data.company_name,
        data.mobile_primary,
        data.mobile_alt,
        data.address,
        data.district,
        data.state,
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

exports.softDelete = async id => {
  await pool.query(
    `UPDATE transports SET is_active=0 WHERE id=?`,
    [id]
  );
};
