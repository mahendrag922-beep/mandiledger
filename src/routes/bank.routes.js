const express = require("express");
const auth = require("../middlewares/auth.middleware");
const bankController = require("../controllers/bank.controller");

const router = express.Router();

router.post("/", auth, bankController.addBank);
router.get("/", auth, bankController.getBanks);
router.get("/:id/history", auth, bankController.getBankHistory);
router.get("/entry/:entry_id/usage", auth, bankController.getBankEntryUsage);
router.delete("/:id", auth, bankController.deleteBank);
router.post("/transfer", auth, bankController.transferBankToCash);

module.exports = router;
