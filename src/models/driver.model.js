exports.addDriver = async (conn, transportId, driver) => {
  await conn.query(
    `INSERT INTO transport_drivers
     (transport_id, driver_name, mobile)
     VALUES (?,?,?)`,
    [transportId, driver.driver_name, driver.mobile]
  );
};

exports.getByTransport = async (conn, transportId) => {
  const [rows] = await conn.query(
    "SELECT * FROM transport_drivers WHERE transport_id = ?",
    [transportId]
  );
  return rows;
};
