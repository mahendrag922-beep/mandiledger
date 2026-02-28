const VoucherPayment = require("../models/voucherPayment.model");

exports.createVoucherPayment = async ({
  party,
  purchaseVoucherNo,
  paymentType,
  cashId,
  bankName,
  bankEntryId,
  amount,
  createdBy,
  conn
}) => {

  const paymentNo =
    await VoucherPayment.generatePaymentVoucherNo(conn);

  const fullAddress =
    `${party.address}, ${party.district},
     ${party.state} - ${party.pincode}`;

  await VoucherPayment.createPaymentVoucher({
    payment_voucher_no: paymentNo,
    party_id: party.id,
    party_name: party.name,
    address: fullAddress,
    purchase_voucher_no: purchaseVoucherNo,
    payment_type: paymentType,
    cash_id: cashId,
    bank_name: bankName,
    bank_entry_id: bankEntryId,
    amount,
    created_by: createdBy
  }, conn);

  return paymentNo;
};