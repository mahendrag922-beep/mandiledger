const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const {
  getStock,
  addStock,
  deleteStock
} = require("../controllers/stock.controller");
const router = express.Router();
router.get("/", auth, role("trader", "munim"),getStock);
router.post("/",auth, role("trader", "munim"), addStock);
router.delete("/:id",auth, role("trader", "munim"), deleteStock);

module.exports = router;
