import sys
import json
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import Image

pdf_path = sys.argv[1]
data = json.loads(sys.argv[2])

doc = SimpleDocTemplate(pdf_path)
elements = []

styles = getSampleStyleSheet()

# ================= HEADER =================

# Trader Info (Change this to your real trader data)
trader_name = "Gupta Mandi Traders"
trader_address = "Main Mandi Road, Lucknow"
trader_mobile = "9876543210"
trader_gst = "09ABCDE1234F1Z5"

# Logo (Put logo.png in utils folder)
try:
    logo = Image("utils/logo.png", width=1.2*inch, height=1.2*inch)
    elements.append(logo)
except:
    pass

elements.append(Paragraph(f"<b>{trader_name}</b>", styles["Title"]))
elements.append(Paragraph(trader_address, styles["Normal"]))
elements.append(Paragraph(f"Mobile: {trader_mobile}", styles["Normal"]))
elements.append(Paragraph(f"GSTIN: {trader_gst}", styles["Normal"]))

elements.append(Spacer(1, 15))

# ================= INVOICE DETAILS =================

elements.append(Paragraph(f"<b>Invoice No:</b> {data['voucher_no']}", styles["Normal"]))
elements.append(Paragraph(f"<b>Invoice Date:</b> {data['created_at']}", styles["Normal"]))
elements.append(Spacer(1, 15))

elements.append(Paragraph(f"<b>Farmer Name:</b> {data['party_name']}", styles["Normal"]))
elements.append(Paragraph(f"<b>Mobile:</b> {data['mobile']}", styles["Normal"]))
elements.append(Spacer(1, 15))

# ================= TABLE =================

table_data = [
    ["Commodity", data["commodity"]],
    ["Bags", str(data["bags"])],
    ["Vehicle No", data["vehicle_no"]],
    ["Total Weight (Kg)", str(data["total_weight_kg"])],
    ["Wajan Dhalta (Kg)", str(data["wajan_dhalta_kg"])],
    ["Final Weight (Kg)", str(data["final_weight_kg"])],
    ["Rate (₹/Kg)", str(data["rate_per_kg"])],
    ["Commission Amount", str(data["commission_amount"])],
    ["Final Amount", str(data["final_amount"])]
]

table = Table(table_data, colWidths=[220, 220])
table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
    ('GRID', (0,0), (-1,-1), 1, colors.grey),
    ('FONTSIZE', (0,0), (-1,-1), 10),
]))

elements.append(table)

elements.append(Spacer(1, 30))

elements.append(Paragraph("Farmer Signature: ___________________", styles["Normal"]))
elements.append(Paragraph("Authorized Signatory: ___________________", styles["Normal"]))

doc.build(elements)
