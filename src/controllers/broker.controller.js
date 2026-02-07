const Broker = require("../models/broker.model");
const AppError = require("../utils/AppError");

exports.addBroker = async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new AppError("Broker name required", 400));

  const id = await Broker.create(req.body);

  res.status(201).json({
    status: "success",
    brokerId: id
  });
};

exports.getBrokers = async (req, res) => {
  const rows = await Broker.getAll();
  res.json({ status: "success", data: rows });
};

exports.getBrokerById = async (req, res, next) => {
  const broker = await Broker.getById(req.params.id);
  if (!broker) return next(new AppError("Broker not found", 404));

  res.json({ status: "success", data: broker });
};
