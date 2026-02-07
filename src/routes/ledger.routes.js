const express = require("express");
const auth = require("../middlewares/auth.middleware");
const { getLedgerByParty } = require("../controllers/ledger.controller");

const router = express.Router();

router.get("/:partyId", auth, getLedgerByParty);

module.exports = router;
