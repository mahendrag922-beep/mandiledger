exports.addVehicle = async (conn, transportId, vehicle) => {
  await conn.query(
    `INSERT INTO transport_vehicles
     (transport_id, vehicle_no, tyres)
     VALUES (?,?,?)`,
    [transportId, vehicle.vehicle_no, vehicle.tyres]
  );
};

exports.getByTransport = async (conn, transportId) => {
  const [rows] = await conn.query(
    "SELECT * FROM transport_vehicles WHERE transport_id = ?",
    [transportId]
  );
  return rows;
};
