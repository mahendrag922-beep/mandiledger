const Stock = require("../models/stock.model");
const pool = require("../config/db");

/* GET STOCK */
exports.getStock = async (req, res) => {
  const data = await Stock.getAllStock();
  res.json({ status: "success", data });
};

/* ADD STOCK */
exports.addStock = async (req, res) => {
  const { commodity, hsn_no } = req.body;
  
  if (!commodity) {
    return res.status(400).json({
      status: "fail",
      message: "Commodity required"
    });
  }
       // 🔎 Check duplicate manually (clean error)
    const [existing] = await pool.query(
     "SELECT id FROM stock WHERE lower(commodity) = lower(?) AND is_deleted = 0",
      [commodity]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        status: "fail",
        message: "Commodity already exists"
      });
    }

  await Stock.addCommodity(req.body);

  res.json({
    status: "success",
    message: "Commodity added"
  });
};

/* DELETE STOCK */
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;

    const [[row]] = await pool.query(
      "SELECT quantity FROM stock WHERE id = ?",
      [id]
    );
    
    if (!row) {
      return res.status(404).json({
        status: "fail",
        message: "Commodity not found"
      });
    }
     console.log(Number(row.quantity));
    // 🔥 PREVENT DELETE
    if (Number(row.quantity) > 0) {
      return res.status(400).json({
        status: "fail",
        message: "Cannot delete commodity. Stock quantity is greater than 0."
      });
    }
  await Stock.deleteCommodity(req.params.id);

  res.json({
    status: "success",
    message: "Deleted successfully"
  });
  } catch (err) {
    next(err);
  }
};
