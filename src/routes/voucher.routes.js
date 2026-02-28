const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {getVouchers} = require("../controllers/voucher.controller");
const {createPurchaseVoucher,updatePurchaseVoucher,reversePurchaseVoucher,getPurchaseItems} = require("../controllers/voucherPurchase.controller");
const{createSaleVoucher,updateSaleVoucher,reverseSaleVoucher}=require("../controllers/voucherSale.controller");
const {printPurchaseSlip,savePurchaseSlip} = require("../controllers/purchaseSlip.controller");
const saleInvoice = require("../controllers/saleInvoice.controller");
const transportController = require("../controllers/transportVoucher.controller");

const router = express.Router();

/* GET vouchers */
router.get("/", auth, role("trader","munim"), getVouchers);

/* CREATE purchase voucher */
router.post("/purchase",auth,role("trader","munim"),createPurchaseVoucher);
router.put("/purchase/:id",auth,role("trader", "munim"),updatePurchaseVoucher);
router.post("/purchase/:id/reverse",auth,role("trader"),reversePurchaseVoucher);
router.get("/purchase/:id/items",auth,getPurchaseItems);
router.get("/purchase/:id/print",printPurchaseSlip);
router.post("/purchase/:id/save", auth, savePurchaseSlip);
router.post("/sale", auth, role("trader","munim"), createSaleVoucher);
router.put("/sale/:id", auth, role("trader","munim"), updateSaleVoucher);
router.post("/sale/:id/reverse", auth, role("trader","munim"), reverseSaleVoucher);
router.post("/sale/:id/save", auth, saleInvoice.saveSaleInvoice);
router.get("/sale/:id/print",  saleInvoice.printSaleInvoice);

router.get("/transport/history/:voucherNo",auth,transportController.getTransportHistory
);


module.exports = router;
