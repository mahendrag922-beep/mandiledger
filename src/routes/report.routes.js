const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  dailyReport,
  outstandingReport,
  profitReport,
  commodityStockReport,
  todayPurchases,
  todaySales
} = require("../controllers/report.controller");

const router = express.Router();

router.get("/daily", auth, role("trader", "munim"), dailyReport);
router.get("/outstanding", auth, role("trader", "munim"), outstandingReport);
router.get("/profit", auth, role("trader"), profitReport);
router.get("/stock-commodity", auth, commodityStockReport);
router.get("/today-purchases", auth, todayPurchases);
router.get("/today-sales", auth, todaySales);


module.exports = router;
