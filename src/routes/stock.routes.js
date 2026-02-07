const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { getStock } = require("../controllers/stock.controller");

const router = express.Router();

router.get("/", auth, getStock);

module.exports = router;
