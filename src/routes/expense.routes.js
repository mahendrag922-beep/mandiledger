const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const router = express.Router();

const controller = require("../controllers/expense.controller");

router.post("/expense", controller.addExpense);

/* SPECIFIC ROUTES FIRST */

router.get("/expense/direct", controller.getDirectExpenses);

router.get("/expense/indirect-total", controller.getIndirectTotals);

router.get("/expense/mandi-commission",auth,role("trader","munim"),controller.getMandiCommission);
router.get("/expense/mill-adjustment/:voucher_no",controller.getMillAdjustmentDetails);
router.get("/expense/mill-analytics",controller.getMillDeductionAnalytics);
router.get("/expense/mill-breakdown/:mill",controller.getMillBreakdown);
router.get("/expense-categories", controller.getExpenseCategories);
router.get("/expense/direct-summary",controller.getDirectExpenseTotals);
router.get("/expense/direct-category/:category",controller.getDirectExpenseByCategory);
router.get("/expense/dashboard",controller.getExpenseDashboard);
/* GENERIC ROUTE LAST */

router.get("/expense/:type", controller.getExpenseByType);

module.exports = router;