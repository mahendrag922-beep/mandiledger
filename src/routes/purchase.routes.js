const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { createPurchase } = require("../controllers/purchase.controller");

const router = express.Router();

router.post("/", auth, role("trader", "munim"), createPurchase);

module.exports = router;
