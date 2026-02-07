const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { createSale } = require("../controllers/sale.controller");

const router = express.Router();

router.post("/", auth, role("trader", "munim"), createSale);

module.exports = router;
