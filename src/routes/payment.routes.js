const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { addPayment } = require("../controllers/payment.controller");

const router = express.Router();

router.post("/", auth, role("trader", "munim"), addPayment);

module.exports = router;
