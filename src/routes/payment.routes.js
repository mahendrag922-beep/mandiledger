const express = require("express");
const auth = require("../middlewares/auth.middleware");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

router.post("/", auth, paymentController.addPayment);

module.exports = router;
