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
  doc.text(voucher.billing_address || "", startX + 5, boxTop + 45, { width: 210 });
  doc.text(`GSTIN: ${mill.gstn || "-"}`, startX + 5, boxTop + 125);

  doc.text("Shipped To:", startX + 225, boxTop + 5);
  doc.text(mill.name || "", startX + 225, boxTop + 20, { width: 150 });
  doc.text(voucher.shipping_address || "", startX + 225, boxTop + 55, { width: 150 });
  doc.text(`GSTIN: ${mill.gstn || "-"}`, startX + 225, boxTop + 125);

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

  /* ================= TABLE HEADER ================= */

const tableTop = y;
const rowHeight = 25;
const dataRowHeight = 150;

const colX = {
  sno: startX,
  desc: startX + 30,
  unit: startX + 260,
  hsn: startX + 300,
  qty: startX + 350,
  rate: startX + 410,
  amt: startX + 470,
  end: startX + width
};

// Header Background
doc.rect(startX, tableTop, width, rowHeight)
   .fillAndStroke("#eeeeee", "#000");

doc.fillColor("black").fontSize(9);

doc.text("S.No", colX.sno + 5, tableTop + 7);
doc.text("Description of Goods", colX.desc + 5, tableTop + 7);
doc.text("Unit", colX.unit + 5, tableTop + 7);
doc.text("HSN", colX.hsn + 5, tableTop + 7);
doc.text("Qty", colX.qty + 5, tableTop + 7);
doc.text("Rate", colX.rate + 5, tableTop + 7);
doc.text("Amt After Tax", colX.amt + 5, tableTop + 7);

// Vertical Lines (Header)
Object.values(colX).forEach(x => {
  doc.moveTo(x, tableTop)
     .lineTo(x, tableTop + rowHeight)
     .stroke();
});

/* ================= DATA ROW ================= */

const rowY = tableTop + rowHeight;

doc.rect(startX, rowY, width, dataRowHeight)
     .fillAndStroke("#f9f9f9", "#000");   // light grey background

doc.fillColor("black");  // Important reset

// Vertical Lines (Data Row)
Object.values(colX).forEach(x => {
  doc.moveTo(x, rowY)
     .lineTo(x, rowY + dataRowHeight)
     .stroke();
});

const qty = Number(voucher.final_weight_kg) || 0;
const rate = Number(voucher.rate_per_kg) || 0;
const amount = Number(voucher.final_amount) || 0;

doc.fontSize(9);

doc.text("1", colX.sno + 5, rowY + 10);
doc.text(voucher.commodity || "-", colX.desc + 5, rowY + 10, { width: 220 });
doc.text("KG", colX.unit + 5, rowY + 10);
doc.text(voucher.hsn_no || "-", colX.hsn + 5, rowY + 10);
doc.text(qty.toFixed(2), colX.qty + 5, rowY + 10);
doc.text(rate.toFixed(2), colX.rate + 5, rowY + 10);
doc.text(amount.toFixed(2), colX.amt + 5, rowY + 10);

y = rowY + dataRowHeight;

/* ================= TOTAL ROW ================= */

doc.rect(startX, y, width, 25).stroke();

doc.fontSize(10);
doc.text("Total", colX.rate + 5, y + 7);
doc.text(amount.toFixed(2), colX.amt + 5, y + 7);

y += 25;

/* ================= ROUND OFF ROW ================= */

const roundOff = Math.round(amount) - amount;

doc.rect(startX, y, width, 25).stroke();
doc.text("Round Off", colX.rate + 5, y + 7);
doc.text(roundOff.toFixed(2), colX.amt + 5, y + 7);

y += 25;

/* ================= FINAL AMOUNT ROW ================= */

const finalAmount = amount + roundOff;
doc.lineWidth(2);
doc.rect(startX, y, width , 30).stroke();
doc.fontSize(12)
   .font("Helvetica-Bold")
   .text("Final Amount : ", colX.rate , y + 8);
doc.fontSize(11).text(finalAmount.toFixed(2), colX.amt +25 , y +8 );
doc.font("Helvetica"); // reset
doc.lineWidth(1);

y += 30;



  doc.rect(startX, y, width, 30).stroke();
  doc.fontSize(9).text("Amount in Words: Rupees " + numberToWords(Math.round(finalAmount)), startX + 5, y + 8);

  y += 30;

// Outer Box Only
doc.rect(startX, y, width, 60).stroke();

doc.fontSize(10).font("Helvetica-Bold");
doc.text("Bank Details :", startX + 5, y + 7);

doc.font("Helvetica").fontSize(9);

// Bank 1
doc.text(
  "Union Bank Of India  |  A/C No: 663601010050161  |  IFSC: UBIN0566365",
  startX + 5,
  y + 22,
  { width: width - 10 }
);

// Bank 2 (Below it – no line between)
doc.text(
  "State Bank Of India  |  A/C No: 43163293117  |  IFSC: SBIN0016463",
  startX + 5,
  y + 37,
  { width: width - 10 }
);

y += 60;

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

    const [[voucher]] = await pool.query(
      "SELECT * FROM voucher_sale WHERE id=?",
      [id]
    );

    if (!voucher) {
      return res.status(404).json({
        status: "fail",
        message: "Voucher not found"
      });
    }

    const [[mill]] = await pool.query(
      "SELECT * FROM parties WHERE id=?",
      [voucher.party_id]
    );

    if (!mill) {
      return res.status(404).json({
        status: "fail",
        message: "Mill not found"
      });
    }

    const filePath = generateSaleInvoicePDF(voucher, mill);

    res.json({ status: "success", path: filePath });

  } catch (err) {
    console.error("SALE PDF ERROR:", err);
    next(err);
  }
};
/* PRINT */
exports.printSaleInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[voucher]] = await pool.query(
      "SELECT * FROM voucher_sale WHERE id=?",
      [id]
    );

    if (!voucher) {
      return res.status(404).send("Voucher not found");
    }

    const [[mill]] = await pool.query(
      "SELECT * FROM parties WHERE id=?",
      [voucher.party_id]
    );

    if (!mill) {
      return res.status(404).send("Mill not found");
    }

    const filePath = generateSaleInvoicePDF(voucher, mill);

    res.sendFile(filePath);

  } catch (err) {
    console.error("SALE PRINT ERROR:", err);
    next(err);
  }
};