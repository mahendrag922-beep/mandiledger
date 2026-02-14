const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const os = require("os");
const pool = require("../config/db");


/* ================= AMOUNT TO WORDS ================= */

function numberToWords(num) {
  const a = [
    "", "One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen",
    "Eighteen","Nineteen"
  ];
  const b = ["", "", "Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  if ((num = num.toString()).length > 9) return "Overflow";

  const n = ("000000000" + num).substr(-9).match(/.{1,2}/g);
  let str = "";

  str += (n[0] != 0) ? (a[Number(n[0])] || b[n[0][0]] + " " + a[n[0][1]]) + " Crore " : "";
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Lakh " : "";
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Thousand " : "";
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Hundred " : "";
  str += (n[4] != 0) ? ((str != "") ? "and " : "") +
    (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + " " : "";

  return str.trim() + " Only";
}

/* ================= MAIN PDF FUNCTION ================= */

function generateSaleInvoicePDF(voucher, mill) {

  const desktopPath = path.join(os.homedir(), "Desktop");
  const folder = path.join(desktopPath, "Sale", mill.name.replace(/[^a-zA-Z0-9]/g, "_"));

  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const filePath = path.join(folder, `${voucher.voucher_no}.pdf`);

  const doc = new PDFDocument({ size: "A4", margin: 20 });
  doc.pipe(fs.createWriteStream(filePath));

  const width = 555;
  const startX = 20;
  let y = 20;

  /* OUTER BORDER */
  doc.rect(startX, y, width, 800).stroke();

  /* ================= HEADER ================= */

  const logoPath = path.join(__dirname, "../assets/yes.png");

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, startX + 10, y +5, { width: 70 });
  }

  doc.fontSize(16).text("M/S VAISHNAVI ENTERPRISES", 120, y + 10);
  doc.fontSize(9)
     .text("King Nagar Karari", 120, y + 30)
     .text("Kaushambi Uttar Pradesh 212206", 120, y + 45);

  doc.text("Mobile: 9839142549", 420, y + 10)
     .text("7007820697", 420, y + 25)
     .text("Email: yes.karari@gmail.com", 420, y + 40);

  y += 80;
  doc.moveTo(startX, y).lineTo(startX + width, y).stroke();

  doc.fontSize(10)
     .text("GSTIN: 09CSSPK6811R1ZO", startX + 10, y + 5);

  doc.fontSize(13)
     .text("Bill of Supply", 250, y + 5);

  doc.text("Original Copy", 470, y + 5);

  y += 30;
  doc.moveTo(startX, y).lineTo(startX + width, y).stroke();

  /* ================= BILLED & SHIPPED ================= */

  const boxTop = y;
  const boxHeight = 140;

  doc.rect(startX, boxTop, 220, boxHeight).stroke();
  doc.rect(startX + 220, boxTop, 160, boxHeight).stroke();
  doc.rect(startX + 380, boxTop, 175, boxHeight).stroke();

  doc.fontSize(9).text("Billed To:", startX + 5, boxTop + 5);

  doc.text(mill.name || "", startX + 5, boxTop + 20, { width: 210 });
  doc.text(mill.address || "", startX + 5, boxTop + 35, { width: 210 });
  doc.text(`${mill.district || ""}, ${mill.state || ""}`, startX + 5, boxTop + 95, { width: 210 });
  doc.text(`GSTIN: ${mill.gstn || "-"}`, startX + 5, boxTop + 110);

  doc.text("Shipped To:", startX + 225, boxTop + 5);
  doc.text(mill.name || "", startX + 225, boxTop + 20, { width: 150 });
  doc.text(mill.address || "", startX + 225, boxTop + 45, { width: 150 });
  doc.text(`${mill.district || ""}, ${mill.state || ""}`, startX + 225, boxTop + 95, { width: 150 });
  doc.text(`GSTIN: ${mill.gstn || "-"}`, startX + 225, boxTop + 110);

  doc.text(`Invoice No: ${voucher.voucher_no}`, startX + 385, boxTop + 5);
  doc.text(`Invoice Date: ${new Date(voucher.created_at).toLocaleDateString()}`, startX + 385, boxTop + 20);
  doc.text(`Broker_name: ${voucher.broker_name || "-"}`, startX + 385, boxTop + 35);
  doc.text(`Referred By: ${voucher.broker_company || "-"}`, startX + 385, boxTop + 50);
  doc.text(`Transport: ${voucher.transport_name || "-"}`, startX + 385, boxTop + 65);
  doc.text(`Vehicle No: ${voucher.vehicle_no || "-"}`, startX + 385, boxTop + 80);
  doc.text(`Driver: ${voucher.driver_mobile || "-"}`, startX + 385, boxTop + 95);
  doc.text(`Place of Supply: ${voucher.place_of_supply || "-"}`, startX + 385, boxTop + 110);
  doc.text(`Reverse Charge: N`, startX + 385, boxTop + 125);

  y += boxHeight;

  /* ================= TABLE ================= */

  const tableTop = y;

  doc.rect(startX, tableTop, width, 25).fillAndStroke("#eeeeee", "#000");

  doc.fillColor("black");
  doc.fontSize(9);
  doc.text("SNo", startX + 5, tableTop + 7);
  doc.text("Description of Goods", startX + 40, tableTop + 7);
  doc.text("Unit", startX + 270, tableTop + 7);
  doc.text("HSN", startX + 320, tableTop + 7);
  doc.text("Qty", startX + 360, tableTop + 7);
  doc.text("Rate", startX + 420, tableTop + 7);
  doc.text("Amt After Tax", startX + 470, tableTop + 7);

  const rowY = tableTop + 25;
  const qty = Number(voucher.final_weight_kg) || 0;
  const rate = Number(voucher.rate_per_kg) || 0;
  const amount = Number(voucher.final_amount) || 0;

  doc.rect(startX, rowY, width, 60).stroke();

  doc.text("1", startX + 5, rowY + 10);
  doc.text(voucher.commodity || "-", startX + 40, rowY + 10, { width: 220 });
  doc.text("KG", startX + 270, rowY + 10);
  doc.text(voucher.hsn_no || "-", startX + 320, rowY + 10);
  doc.text(qty.toFixed(2), startX + 360, rowY + 10);
  doc.text(rate.toFixed(2), startX + 420, rowY + 10);
  doc.text(amount.toFixed(2), startX + 470, rowY + 10);

  y = rowY + 60;

  doc.rect(startX, y, width, 25).stroke();
  doc.text("Total", startX + 420, y + 7);
  doc.text(amount.toFixed(2), startX + 470, y + 7);

  y += 25;

  const roundOff = Math.round(amount) - amount;
  const finalAmount = amount + roundOff;

  doc.rect(startX, y, width, 25).stroke();
  doc.text("Round Off", startX + 420, y + 7);
  doc.text(roundOff.toFixed(2), startX + 470, y + 7);

  y += 25;

  doc.rect(startX, y, width, 30).stroke();
  doc.fontSize(11).text("Final Amount", startX + 380, y + 8);
  doc.fontSize(11).text(finalAmount.toFixed(2), startX + 470, y + 8);

  y += 30;

  doc.rect(startX, y, width, 30).stroke();
  doc.fontSize(9).text("Amount in Words: Rupees " + numberToWords(Math.round(finalAmount)), startX + 5, y + 8);

  y += 30;

  doc.rect(startX, y, width, 25).stroke();
  doc.text("Bank: Union Bank Of India | A/C No: 663601010050161 | IFSC: UBIN0566365", startX + 5, y + 7);

  y += 25;

  doc.rect(startX, y, width, 80).stroke();
  doc.moveTo(startX + 250, y).lineTo(startX + 250, y + 80).stroke();
  doc.moveTo(startX + 400, y).lineTo(startX + 400, y + 80).stroke();

  doc.text("Terms and Conditions:\nAll Subject to Jurisdiction only", startX + 5, y + 10);
  doc.text("Customer Signature", startX + 270, y + 50);
  doc.text("For M/S VAISHNAVI ENTERPRISES\nAuthorized Signatory", startX + 410, y + 40);

  /* WATERMARK */
  doc.save();
  doc.opacity(0.05);
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 180, 300, { width: 250 });
  }
  doc.restore();

  doc.end();
  return filePath;
}
/* SAVE */
exports.saveSaleInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[voucher]] = await pool.query("SELECT * FROM voucher_sale WHERE id=?", [id]);
    const [[mill]] = await pool.query("SELECT * FROM parties WHERE id=?", [voucher.party_id]);

    const filePath = generateSaleInvoicePDF(voucher, mill);

    res.json({ status: "success", path: filePath });

  } catch (err) {
    next(err);
  }
};

/* PRINT */
exports.printSaleInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[voucher]] = await pool.query("SELECT * FROM voucher_sale WHERE id=?", [id]);
    const [[mill]] = await pool.query("SELECT * FROM parties WHERE id=?", [voucher.party_id]);

    const filePath = generateSaleInvoicePDF(voucher, mill);

    res.sendFile(filePath);

  } catch (err) {
    next(err);
  }
};
