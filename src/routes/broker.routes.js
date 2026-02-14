const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const {
  createBroker,
  getAllBrokers,
  getBroker,
  updateBroker,
  deleteBroker
} = require("../controllers/broker.controller");

const router = express.Router();

/* ALL BROKERS */
router.get("/", auth, role("trader","munim"), getAllBrokers);

/* SINGLE BROKER */
router.get("/:id", auth, role("trader","munim"), getBroker);

/* CREATE */
router.post("/", auth, role("trader","munim"), createBroker);

/* UPDATE */
router.put("/:id", auth, role("trader","munim"), updateBroker);

/* DELETE */
router.delete("/:id", auth, role("trader","munim"), deleteBroker);

module.exports = router;
