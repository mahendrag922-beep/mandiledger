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



function generateSlipPDF(voucher, saveToDesktop = false) {

  const desktopPath = path.join(os.homedir(), "Desktop");
  const folder = path.join(desktopPath, "Purchase", voucher.party_name.replace(/[^a-zA-Z0-9]/g, "_"));
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const filePath = path.join(folder, `${voucher.voucher_no}.pdf`);

  const doc = new PDFDocument({ size: "A4", margin: 20 });
  doc.pipe(fs.createWriteStream(filePath));

  const pageWidth = 555;
  const startX = 20;
  let y = 20;

  /* OUTER BORDER */
  doc.rect(startX, y, pageWidth, 800).stroke();

  /* ================= HEADER ================= */

  const logoPath = path.join(__dirname, "../assets/yes.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, startX + 10, y + 5, { width: 60 });
  }

  doc.fontSize(16).text("M/S VAISHNAVI ENTERPRISES", 120, y + 10);
  doc.fontSize(9)
    .text("King Nagar Karari", 120, y + 30)
    .text("Kaushambi Uttar Pradesh 212206", 120, y + 45);

  doc.text("Mobile: 9839142549", 420, y + 10)
    .text("7007820697", 420, y + 25)
    .text("Email: yes.karari@gmail.com", 420, y + 40);

  y += 80;
  doc.moveTo(startX, y).lineTo(startX + pageWidth, y).stroke();

  /* ================= WATERMARK ================= */

  
  if (voucher.is_reversed) {
  doc.save();
  doc.rotate(45, { origin: [300, 400] })
    .fontSize(70)
    .fillColor("gray")
    .opacity(0.15)
    .text("REVERSED", 150, 350);
  doc.restore();
  doc.opacity(1).fillColor("black");
}else{
doc.save();
  doc.rotate(45, { origin: [300, 400] })
    .fontSize(70)
    .fillColor("red")
    .opacity(0.08)
    .text("NOT PAID", 150, 300);
  doc.restore();
  doc.opacity(1).fillColor("black");

}

  /* ================= ROW 1 ================= */

doc.fontSize(11);
doc.text(`Party Name : ${voucher.party_name}`, 30, y + 10);
doc.text(`Invoice No : ${voucher.voucher_no}`, 270, y + 10);
doc.text(`Invoice Date : ${new Date(voucher.created_at).toLocaleDateString()}`, 430, y + 10);

y += 30;
doc.moveTo(20, y).lineTo(575, y).stroke();

/* ================= ROW 2 ================= */

doc.text(`No. of Bags : ${voucher.total_bags}`, 30, y + 10);
doc.text(`Vehicle No : ${voucher.vehicle_no}`, 270, y + 10);
//doc.text(`Vehicle No : ${voucher.vehicle_no || "-"}`, 430, y + 10);

y += 30;
doc.moveTo(20, y).lineTo(575, y).stroke();

/* ================= MAIN TABLE ================= */

const tableTop = y;
const rowHeight = 25;
const dataRowHeight = 120;
const width = 555;

// Column positions (balanced properly)
const colX = {
  sno: startX,
  commodity: startX + 35,
  unit: startX + 120,
  hsn: startX + 155,
  actual: startX + 195,
  finalWt: startX + 245,
  dhalta: startX + 295,
  commission: startX + 345,
  totalAmt: startX + 405,
  finalAmt: startX + 470,
  end: startX + width
};

/* HEADER ROW */

doc.rect(startX, tableTop, width, rowHeight)
   .fillAndStroke("#eeeeee", "#000");

doc.fillColor("black").fontSize(8);

doc.text("S.No", colX.sno + 5, tableTop + 8);
doc.text("Commodity", colX.commodity + 5, tableTop + 8);
doc.text("Unit", colX.unit + 5, tableTop + 8);
doc.text("HSN", colX.hsn + 5, tableTop + 8);
doc.text("Actual Wt", colX.actual + 5, tableTop + 8);
doc.text("Final Wt", colX.finalWt + 5, tableTop + 8);
doc.text("Dhalta", colX.dhalta + 5, tableTop + 8);
doc.text("Commission", colX.commission + 5, tableTop + 8);
doc.text("Total Amt", colX.totalAmt + 5, tableTop + 8);
doc.text("Final Amt", colX.finalAmt + 5, tableTop + 8);

// Vertical lines
Object.values(colX).forEach(x => {
  doc.moveTo(x, tableTop)
     .lineTo(x, tableTop + rowHeight)
     .stroke();
});

/* DATA ROW */

let rowY = tableTop + rowHeight;
const items = voucher.items || [];

doc.fontSize(9);

items.forEach((item, index) => {

  doc.rect(startX, rowY, width, 25).stroke();

  Object.values(colX).forEach(x => {
    doc.moveTo(x, rowY)
       .lineTo(x, rowY + 25)
       .stroke();
  });

  doc.text(index + 1, colX.sno + 5, rowY + 8);
  doc.text(item.commodity || "-", colX.commodity + 5, rowY + 8);
  doc.text("KG", colX.unit + 5, rowY + 8);
  doc.text(item.hsn_no || "-", colX.hsn + 5, rowY + 8);
  doc.text(Number(item.total_weight_kg).toFixed(2), colX.actual + 5, rowY + 8);
  doc.text(Number(item.final_weight_kg).toFixed(2), colX.finalWt + 5, rowY + 8);
  doc.text(Number(item.wajan_dhalta_kg).toFixed(2), colX.dhalta + 5, rowY + 8);
  doc.text(Number(item.commission_amount).toFixed(2), colX.commission + 5, rowY + 8);
  doc.text(Number(item.total_amount).toFixed(2), colX.totalAmt + 5, rowY + 8);
  doc.text(Number(item.final_amount).toFixed(2), colX.finalAmt + 5, rowY + 8);

  rowY += 25;
});

y = rowY + dataRowHeight;
/* ================= TOTAL ROW (ALIGNED CORRECTLY) ================= */

const totalFinalWt = Number(voucher.total_final_weight_kg) || 0;
const totalCommission = Number(voucher.total_commission) || 0;
const totalFinalAmount = Number(voucher.total_final_amount) || 0;


doc.rect(startX, y, width, 30)
   .fillAndStroke("#eeeeee", "#000");

doc.fillColor("black").fontSize(10).font("Helvetica-Bold");

doc.text("Total", colX.commodity + 5, y + 8);

// Under Final Weight column
doc.text(totalFinalWt.toFixed(2), colX.finalWt + 5, y + 8);

// Under Commission column
doc.text(totalCommission.toFixed(2), colX.commission + 5, y + 8);

// Under Final Amount column
doc.text(totalFinalAmount.toFixed(2), colX.finalAmt + 5, y + 8);

doc.fillColor("black").font("Helvetica");

y += 30;

/* ================= AMOUNT IN WORDS + ROUND OFF ================= */

const roundOff = Math.round(totalFinalAmount) - totalFinalAmount;
const finalAmount = totalFinalAmount + roundOff;

doc.rect(startX, y, width, 40).stroke();

// Vertical split (like image)
doc.moveTo(startX + 380, y)
   .lineTo(startX + 380, y + 40)
   .stroke();

doc.fontSize(10);

doc.text(
  "Amount in Words: ₹ " + numberToWords(parseInt(finalAmount)) + " Only",
  startX + 10,
  y + 12,
  { width: 360 }
);

doc.text("Round Off:", startX + 390, y + 5);
doc.text(roundOff.toFixed(2), startX + 470, y + 5);

doc.font("Helvetica-Bold").fontSize(16);
doc.text("Amount:", startX + 390, y + 20);
doc.text(finalAmount.toFixed(2), startX + 470, y + 20);

doc.font("Helvetica");

y += 40;

  /* ================= FOOTER ================= */

  let footerY = 760;

  doc.moveTo(20, footerY).lineTo(575, footerY).stroke();

  doc.moveTo(190, footerY).lineTo(190, 820).stroke();
  doc.moveTo(380, footerY).lineTo(380, 820).stroke();

  doc.fontSize(10)
    .text("Terms & Conditions:\nGoods once sold will not be taken back.", 25, footerY + 5);

  doc.text("Customer Signature", 210, footerY + 25);
  doc.text("Authorized Signature", 410, footerY + 25);

  doc.end();
  return filePath;
}

exports.printPurchaseSlip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[voucher]] = await pool.query(
      "SELECT * FROM voucher_purchase WHERE id = ?",
      [id]
    );

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    // ✅ ALWAYS fetch items from voucher_purchase_items
    const [items] = await pool.query(
      `SELECT commodity, hsn_no, bags,
              total_weight_kg, wajan_dhalta_kg,
              final_weight_kg, rate_per_kg,
              total_amount, commission_amount, final_amount
       FROM voucher_purchase_items
       WHERE voucher_id = ?`,
      [id]
    );

    voucher.items = items;   // attach items

    const filePath = generateSlipPDF(voucher, true);
    res.sendFile(filePath);

  } catch (err) {
    next(err);
  }
};
exports.savePurchaseSlip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[voucher]] = await pool.query(
      "SELECT * FROM voucher_purchase WHERE id = ?",
      [id]
    );

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }

    // ✅ ALWAYS fetch items from voucher_purchase_items
    const [items] = await pool.query(
      `SELECT commodity, hsn_no, bags,
              total_weight_kg, wajan_dhalta_kg,
              final_weight_kg, rate_per_kg,
              total_amount, commission_amount, final_amount
       FROM voucher_purchase_items
       WHERE voucher_id = ?`,
      [id]
    );

    voucher.items = items;   // attach items

    const filePath = generateSlipPDF(voucher, true);
    res.sendFile(filePath);

  
    if (!filePath) {
      return res.status(500).json({
        status: "fail",
        message: "PDF generation failed"
      });
    }

    res.json({
      status: "success",
      message: "PDF saved successfully",
      path: filePath
    });

  } catch (err) {
    console.error("PDF ERROR:", err);  // 🔥 VERY IMPORTANT
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};
