const pool = require("../config/db");
const Transport = require("../models/transport.model");
const Driver = require("../models/driver.model");
const Vehicle = require("../models/vehicle.model");
const AppError = require("../utils/AppError");

exports.addTransport = async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const {
      company_name,
      drivers = [],
      vehicles = []
    } = req.body;

    if (!company_name) {
      throw new AppError("Company name required", 400);
    }

    const transportId = await Transport.createTransport(conn, req.body);

    for (const d of drivers) {
      await Driver.addDriver(conn, transportId, d);
    }

    for (const v of vehicles) {
      await Vehicle.addVehicle(conn, transportId, v);
    }

    await conn.commit();

    res.status(201).json({
      status: "success",
      transportId
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.getTransports = async (req, res) => {
  const data = await Transport.getAll();
  res.json({ status: "success", data });
};

exports.getTransportDetails = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const transport = await Transport.getById(req.params.id);
    if (!transport) throw new AppError("Transport not found", 404);

    const drivers = await Driver.getByTransport(conn, req.params.id);
    const vehicles = await Vehicle.getByTransport(conn, req.params.id);

    res.json({
      status: "success",
      data: { transport, drivers, vehicles }
    });
  } finally {
    conn.release();
  }
};
exports.updateTransport = async (req, res, next) => {
  await Transport.update(req.params.id, req.body);
  res.json({ status: "success" });
};

exports.deleteTransport = async (req, res, next) => {
  await Transport.softDelete(req.params.id);
  res.json({ status: "success" });
};

exports.addDriverToTransport = async (req, res, next) => {
  const conn = await pool.getConnection();

  try {
    const { id } = req.params; // transport id
    const { driver_name, mobile } = req.body;

    if (!driver_name || !mobile) {
      throw new AppError("Driver name and mobile required", 400);
    }

    await Driver.addDriver(conn, id, {
      driver_name,
      mobile
    });

    res.json({
      status: "success",
      message: "Driver added successfully"
    });

  } catch (err) {
    next(err);
  } finally {
    conn.release();
  }
};
