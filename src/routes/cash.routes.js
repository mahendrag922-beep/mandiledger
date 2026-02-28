const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const cashController = require("../controllers/cash.controller");

const router = express.Router();
router.get("/", auth, role("trader","munim"), cashController.getAvailableCash);

router.get("/all", auth, role("trader","munim"), cashController.getAllCash);

router.get("/:cash_id/history", auth, role("trader","munim"), cashController.getCashHistory);

module.exports = router; 

