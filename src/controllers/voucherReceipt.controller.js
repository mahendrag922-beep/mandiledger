const VoucherReceipt = require("../models/voucherReceipt.model");

exports.createVoucherReceipt = async ({
  mill,
  saleVoucherNo,
  bankName,
  amount,
  case_discount ,
  weight_shortage ,
  unloading_charges ,
  brokerage_commission ,
  quality_claim ,
  bank_charges ,
  final_received_amount,
  createdBy,
  conn
}) => {

  const receiptNo =
    await VoucherReceipt.generateReceiptVoucherNo(conn);

  const fullAddress =
    `${mill.address}, ${mill.district},
     ${mill.state} - ${mill.pincode}`;

  await VoucherReceipt.createReceiptVoucher({
    receipt_voucher_no: receiptNo,
    mill_id: mill.id,
    mill_name: mill.name,
    mill_address: fullAddress,
    sale_voucher_no: saleVoucherNo,
    bank_name: bankName,
    amount,
    case_discount : case_discount,
    weight_shortage : weight_shortage,
    unloading_charges : unloading_charges,
    brokerage_commission :brokerage_commission,
    quality_claim :quality_claim ,
    bank_charges :bank_charges ,
    final_received_amount:final_received_amount,
    created_by: createdBy
  }, conn);

  return receiptNo;
};