const pool = require("../config/db");
const Bank = require("../models/bank.model");

exports.addBank = async (req, res) => {
  const id = await Bank.createBank(req.body);
  res.json({ status: "success", id });
};

exports.getBanks = async (req, res) => {
  const data = await Bank.getBanks();
  res.json({ status: "success", data });
};

exports.deleteBank = async (req, res) => {
  await Bank.deleteBank(req.params.id);
  res.json({ status: "success" });
};
exports.getBankHistory = async (req, res) => {

  const data = await Bank.getBankHistory(req.params.id);

  res.json({ status: "success", data });
};

exports.getBankEntryUsage = async (req, res) => {
  
  const data = await Bank.getBankEntryUsage(req.params.entry_id);

  res.json({ status: "success", data});
};

exports.transferBankToCash = async (req,res,next)=>{

  const { bank_id, entry_id, amount } = req.body;

  const conn = await pool.getConnection();

  try{
    await conn.beginTransaction();

    const cashId = await Bank.transferBankToCash ({
      bank_id,
      entry_id,
      amount,
      conn
    });

    await conn.commit();

    res.json({
      status:"success",
      cash_id: cashId
    });

  }catch(err){
    console.log("Transfer error:",err.message);
    await conn.rollback();
    res.status(400).json({message:err.message});
  }finally{
    conn.release();
  }
};
