const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const os = require("os");
const pool = require("../config/db");


function generateSlipPDF(voucher, saveToDesktop = false) {
  const desktopPath = path.join(os.homedir(), "Desktop");
    const farmerFolder = path.join(
      desktopPath,
      "Purchase",
      voucher.party_name.replace(/[^a-zA-Z0-9]/g, "_")
    );

    if (!fs.existsSync(farmerFolder)) {
      fs.mkdirSync(farmerFolder, { recursive: true });
    }

    const filePath = path.join(
      farmerFolder,
      `${voucher.voucher_no}.pdf`
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 40
    });

    doc.pipe(fs.createWriteStream(filePath));

    const logoPath = path.join(__dirname, "../assets/yes.png");
    console.log("Logo Path:", logoPath);

    /* =============================
       HEADER SECTION
    ==============================*/

    // Logo
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 70 });
    }

    // Company Name
    doc
      .fontSize(18)
      .text("Gupta Mandi Traders", 130, 45);

    doc
      .fontSize(10)
      .text("Main Mandi Road, Lucknow", 130, 70)
      .text("Mobile: 9876543210", 130, 85)
      .text("GSTIN: 09ABCDE1234F1Z5", 130, 100);

    // Invoice Info Right
    doc
      .fontSize(12)
      .text(`Invoice No: ${voucher.voucher_no}`, 380, 50)
      .text(
        `Date: ${new Date(voucher.created_at).toLocaleDateString()}`,
        380,
        70
      );

    doc.moveTo(40, 130).lineTo(555, 130).stroke();

    /* =============================
       WATERMARK
    ==============================*/

    doc.save();
    doc.fontSize(60)
       .fillColor("grey")
       .opacity(0.07)
       .rotate(45, { origin: [300, 400] })
       .text("GUPTA MANDI TRADERS", 100, 350);
    doc.restore();

    doc.opacity(1).fillColor("black");

    /* =============================
       FARMER DETAILS
    ==============================*/

    doc.fontSize(12)
       .text(`Farmer Name: ${voucher.party_name}`, 40, 150)
       .text(`Mobile: ${voucher.mobile || "-"}`, 40, 170)
       .text(`Vehicle No: ${voucher.vehicle_no || "-"}`, 40, 190);

    /* =============================
       TABLE SECTION
    ==============================*/

    const tableTop = 230;
    const col1 = 50;
    const col2 = 300;

    // Outer Border
    doc.rect(40, tableTop - 20, 515, 220).stroke();

    doc.fontSize(12).text("Particular", col1, tableTop - 5);
    doc.text("Value", col2, tableTop - 5);

    doc.moveTo(40, tableTop + 10)
       .lineTo(555, tableTop + 10)
       .stroke();

    let y = tableTop + 25;

    const rows = [
      ["Commodity", voucher.commodity],
      ["Bags", voucher.bags],
      ["Total Weight (Kg)", voucher.total_weight_kg],
      ["Wajan Dhalta (Kg)", voucher.wajan_dhalta_kg],
      ["Final Weight (Kg)", voucher.final_weight_kg],
      ["Rate (₹/Kg)", voucher.rate_per_kg],
      ["Total Amount", `₹ ${voucher.total_amount}`],
      ["Commission (%)", voucher.commission_percent],
      ["Commission Amount", `₹ ${voucher.commission_amount}`],
      ["Final Amount", `₹ ${voucher.final_amount}`]
    ];

    rows.forEach(row => {
      doc.text(row[0], col1, y);
      doc.text(String(row[1]), col2, y);
      y += 20;
    });

    /* =============================
       SIGNATURE SECTION
    ==============================*/

    doc.moveTo(40, 700).lineTo(200, 700).stroke();
    doc.text("Farmer Signature", 40, 705);

    doc.moveTo(380, 700).lineTo(540, 700).stroke();
    doc.text("Authorized Signatory", 380, 705);

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

    const filePath = generateSlipPDF(voucher, true);

    // 🔥 SEND FILE TO BROWSER
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
      return res.status(404).json({
        status: "fail",
        message: "Voucher not found"
      });
    }

    const filePath = generateSlipPDF(voucher, true);

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
