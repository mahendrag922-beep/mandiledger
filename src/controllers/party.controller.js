const Party = require("../models/party.model");
const AppError = require("../utils/AppError");
const pool = require("../config/db");


exports.addParty = async (req, res, next) => {
  const { name, party_type, mobile, address } = req.body;

  if (!name || !party_type) {
    return next(new AppError("Name and party type are required", 400));
  }

  const id = await Party.createParty(req.body);

  res.status(201).json({
    status: "success",
    message: "Party added successfully",
    partyId: id,
  });
};
exports.softDeleteParty = async (req, res) => {
  await pool.query(
    "UPDATE parties SET is_active = 0 WHERE id = ?",
    [req.params.id]
  );

  res.json({ status: "success" });
};

exports.getParties = async (req, res, next) => {
  const parties = await Party.getAllParties();

  res.json({
    status: "success",
    data: parties,
  });
};

exports.getPartyById = async (req, res, next) => {
  const [rows] = await pool.query(
  `SELECT 
     id,
     name,
     party_type,
     mobile,
     address,
     gstn,
     company_name,
     state,
     district,
     pincode
   FROM parties
   WHERE id = ?`,
  [req.params.id]
);

  if (!rows.length) {
    return next(new AppError("Party not found", 404));
  }

  res.json({
    status: "success",
    data: rows[0]
  });
};

