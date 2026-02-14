const Broker = require("../models/broker.model");
const AppError = require("../utils/AppError");

/* CREATE */
exports.createBroker = async (req, res, next) => {
  try {
    const {
      broker_name,
      company_name,
      mobile_primary,
      mobile_alt,
      address,
      district,
      state,
      pincode
    } = req.body;

    if (!broker_name) {
      return next(new AppError("Broker name is required", 400));
    }

    const id = await Broker.createBroker({
      broker_name,
      company_name,
      mobile_primary,
      mobile_alt,
      address,
      district,
      state,
      pincode
    });

    res.status(201).json({
      status: "success",
      brokerId: id
    });

  } catch (err) {
    next(err);
  }
};

/* GET ALL */
exports.getAllBrokers = async (req, res, next) => {
  try {
    const brokers = await Broker.getAllBrokers();

    res.json({
      status: "success",
      data: brokers
    });

  } catch (err) {
    next(err);
  }
};

/* GET ONE */
exports.getBroker = async (req, res, next) => {
  try {
    const broker = await Broker.getBrokerById(req.params.id);

    if (!broker) {
      return next(new AppError("Broker not found", 404));
    }

    res.json({
      status: "success",
      data: broker
    });

  } catch (err) {
    next(err);
  }
};

/* UPDATE */
exports.updateBroker = async (req, res, next) => {
  try {
    const broker = await Broker.getBrokerById(req.params.id);

    if (!broker) {
      return next(new AppError("Broker not found", 404));
    }

    await Broker.updateBroker(req.params.id, req.body);

    res.json({
      status: "success",
      message: "Broker updated successfully"
    });

  } catch (err) {
    next(err);
  }
};

/* DELETE */
exports.deleteBroker = async (req, res, next) => {
  try {
    const broker = await Broker.getBrokerById(req.params.id);

    if (!broker) {
      return next(new AppError("Broker not found", 404));
    }

    await Broker.deleteBroker(req.params.id);

    res.json({
      status: "success",
      message: "Broker deleted successfully"
    });

  } catch (err) {
    next(err);
  }
};
