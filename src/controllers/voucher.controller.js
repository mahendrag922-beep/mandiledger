const PurchaseVoucher = require("../models/voucherPurchase.model");
const SaleVoucher = require("../models/voucherSale.model");
const PaymentVoucher = require("../models/voucherPayment.model");
const ReceiptVoucher = require("../models/voucherReceipt.model");
const transportVoucher =  require("../models/transportVoucher.model");

exports.getVouchers = async (req, res) => {
  const { type } = req.query;

  let data = [];

  if (type === "purchase") data = await PurchaseVoucher.getPurchaseVouchers();
  if (type === "sale") data = await SaleVoucher.getSaleVouchers();
  if (type === "payment") data = await PaymentVoucher.getPaymentVouchers();
  if (type === "receipt") data = await ReceiptVoucher.getReceiptVouchers();
  if(type==="transport") data = await transportVoucher.getTransportVouchers();

  res.json({
    status: "success",
    data
  });
};
