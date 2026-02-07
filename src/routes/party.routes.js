const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  addParty,
  getParties,
  softDeleteParty,
  getPartyById,
} = require("../controllers/party.controller");

const router = express.Router();

// Trader + Munim can add/view parties
router.post("/", auth, role("trader", "munim"), addParty);
router.get("/", auth, role("trader", "munim"), getParties);
router.delete("/:id", auth, softDeleteParty);
router.get("/:id", auth, role("trader", "munim"), getPartyById);



module.exports = router;
