const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  addBroker,
  getBrokers,
  getBrokerById
} = require("../controllers/broker.controller");

const router = express.Router();

router.post("/", auth, role("trader", "munim"), addBroker);
router.get("/", auth, role("trader", "munim"), getBrokers);
router.get("/:id", auth, role("trader", "munim"), getBrokerById);

module.exports = router;
