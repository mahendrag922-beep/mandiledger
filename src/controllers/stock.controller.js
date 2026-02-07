const Stock = require("../models/stock.model");

exports.getStock = async (req, res, next) => {
  const stock = await Stock.getStock();

  res.json({
    status: "success",
    data: stock
  });
};
