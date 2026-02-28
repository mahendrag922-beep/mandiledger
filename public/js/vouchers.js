let currentVouchers = [];
let currentType = "";
let editingVoucherId = null;

async function loadVouchers(type) {
  document.getElementById("voucherTitle").innerText =
    type.toUpperCase() + " Vouchers";

  const head = document.getElementById("voucherHead");
  const body = document.getElementById("voucherBody");

  // 🔁 COMMON HEAD FOR ALL
  if (type === "purchase") {
    head.innerHTML = `
  <tr>
    <th>Voucher No</th>
    <th>Gaddi No</th>
    <th>Party</th>
    <th>Mobile</th>
    <th>Type</th>
    <th>Commodity</th>
    <th>Date & Time</th>
    <th>Bags</th>
    <th>Vehicle</th>
    <th>Commission</th>
    <th>Unloading Charge</th>
    <th>Wajan Dhalta</th>
    <th>Total Qty (Kg)</th>
    <th>Final Qty (Kg)</th>
    <th>Total Amount</th>
    <th>Final Amount</th>
    <th>Modified At</th>
    <th>Action</th>
  </tr>
`;
  }
  if (type === "sale") {
    head.innerHTML = `
    <tr>
      <th>Voucher No</th>
      <th>Mill id</th>
      <th>Mill Name</th>
      <th>GST No</th>
      <th>Billing Address</th>
      <th>Shipping Address</th>
      <th>place of supply</th>
      <th>Commodity</th>
      <th>HSN</th>
      <th>No of Bags</th>
      <th>Weight (Kg)</th>
      <th>Rate</th>
      <th>Amount</th>
      <th>Broker</th>
      <th>Referred by</th>
      <th>Transport</th>
      <th>Drv.mobile</th>
      <th>Created at</th>
      <th>Modified at</th>
      <th>Action</th>
    </tr>
  `;
  }

  if (type === "transport") {
    head.innerHTML = `
    <tr>
      <th>Transport Voucher</th>
      <th>Bilty No</th>
      <th>Transport Company</th>
      <th>Driver</th>
      <th>Mobile</th>
      <th>Vehicle</th>
      <th>Sale Voucher</th>
      <th>Mill</th>
      <th>Shipping Address</th>
      <th>Rate/Qtl</th>
      <th>Total Amount</th>
      <th>Advance</th>
      <th>Remaining</th>
      <th>Status</th>
      <th>Remark</th>
      <th>History</th>
    </tr>
  `;
  }

  if (type === "payment") {

    head.innerHTML = `
      <tr>
        <th>Payment No</th>
        <th>Party</th>
        <th>Address</th>
        <th>Purchase Voucher</th>
        <th>Payment Type</th>
        <th>Amount</th>
        <th>Created By</th>
        <th>Date</th>
      </tr>
    `;
  }
  if (type === "receipt") {

    head.innerHTML = `
      <tr>
        <th>Receipt No</th>
        <th>Mill</th>
        <th>Address</th>
        <th>Sale Voucher</th>
        <th>Bank</th>
        <th>Total Amount</th>
        <th>Case Discount</th>
        <th>Weight Shortage</th>
        <th>Unloading Charges</th>
        <th>brokerage_commission</th>
        <th>Quality Claim</th>
        <th>Bank Charges</th>
        <th>Final Received Amount</th>
        <th>Created By</th>
        <th>Date</th>
      </tr>
    `;
  }

  body.innerHTML = `<tr><td colspan="13">Loading...</td></tr>`;

  currentType = type;

  const res = await api(`/vouchers?type=${type}`);
  const data = await res.json();

  currentVouchers = data.data || [];

  body.innerHTML = "";

  if (!data.data || data.data.length === 0) {
    body.innerHTML =
      `<tr><td colspan="13">No ${type} vouchers</td></tr>`;
    return;
  }

  data.data.forEach(v => {
    if (type === "purchase") {
      body.innerHTML += `
    <tr class="${v.is_reversed ? "reversed" : ""}">
      <td>${v.voucher_no}</td>
      <td>${v.gaddi_no}</td>
      <td>${v.party_name}</td>
      <td>${v.mobile || "-"}</td>
      <td>${type.toUpperCase()}</td>
      <td>
        <button onclick="toggleItems(${v.id}, this)">
          View Items
        </button>
      </td>

      <td>${new Date(v.created_at).toLocaleString()}</td>
      <td>${v.total_bags || 0}</td>
      <td>${v.vehicle_no || "-"}</td>
      <td>₹ ${Number(v.total_commission || 0).toFixed(2)}</td>
      <td>₹ ${Number(v.unloading_charge || 0).toFixed(2)}</td>
      <td>${Number(v.total_wajan_dhalta_kg || 0).toFixed(2)} Kg</td>
      <td>${Number(v.total_weight_kg || 0).toFixed(2)}</td>
      <td>${Number(v.total_final_weight_kg || 0).toFixed(2)}</td>
      <td>₹ ${Number(v.total_amount || 0).toFixed(2)}</td>
      <td>₹ ${Number(v.total_final_amount || 0).toFixed(2)}</td>
      <td>
        ${v.modified_at ? new Date(v.modified_at).toLocaleString() : "-"}
      </td>
      <td>
  ${type === "purchase" && !v.is_reversed
          ? `
        <button class="btn-edit" onclick="openEditVoucher(${v.id})">✏️</button>
        <button class="btn-reverse" onclick="reverseVoucher(${v.id})">↩</button>
        <button onclick="printSlip(${v.id})">🖨 Print</button>
        <button onclick="saveSlip(${v.id})">💾 Save</button>
      `
          : `
        <span class="muted">Reversed</span>
        <button onclick="printSlip(${v.id})">🖨 Print</button>
        <button onclick="saveSlip(${v.id})">💾 Save</button>
      `
        }
</td>
    </tr>
    <!-- EXPANDABLE ITEMS ROW -->
    <tr id="items-${v.id}" style="display:none;">
      <td colspan="16">
        <div class="item-container"></div>
      </td>
    </tr>

  `;
    }
    if (type === "sale") {
      body.innerHTML += `
      <tr>
        <td>${v.voucher_no}</td>
        <td>${v.party_id}</td>
        <td>${v.party_name}</td>
        <td>${v.gst_no || "-"}</td>
        <td>${v.billing_address}</td>
        <td>${v.shipping_address}</td>
        <td>${v.place_of_supply}</td>
        <td>${v.commodity}</td>
        <td>${v.hsn_no}</td>
        <td>${v.bags}</td>
        <td>${v.final_weight_kg}</td>
        <td>₹ ${v.rate_per_kg}</td>
        <td>₹ ${v.final_amount}</td>
        <td>${v.broker_name || "-"}</td>
        <td>${v.broker_company || "-"}</td>
        <td>${v.transport_name || "-"}</td>
        <td>${v.driver_mobile || "-"}</td>
        <td>${new Date(v.created_at).toLocaleString()}</td>
        <td>
        ${v.modified_at ? new Date(v.modified_at).toLocaleString() : "-"}
      </td>
        <td>${type === "sale" && !v.is_reversed
          ? `
                       <button onclick="openEditSale(${v.id})">✏️</button>
                       <button onclick="reverseSale(${v.id})">↩</button>
                       <button onclick="printSaleSlip(${v.id})">🖨 Print</button>
                       <button onclick="saveSaleSlip(${v.id})">💾 Save</button>
                       `
          : `
        <span class="muted">Reversed</span>
        <button onclick="printSaleSlip(${v.id})">🖨 Print</button>
        <button onclick="saveSaleSlip(${v.id})">💾 Save</button>
      `
        }</td>
     </tr>
    `;
    }

    if (type === "transport") {
  body.innerHTML += `
  <tr>
    <td>${v.transport_voucher_no}</td>
    <td>${v.bilty_no || "-"}</td>
    <td>${v.transport_name}</td>
    <td>${v.driver_name || "-"}</td>
    <td>${v.driver_mobile || "-"}</td>
    <td>${v.vehicle_no || "-"}</td>
    <td>${v.sale_voucher_no}</td>
    <td>${v.mill_name}</td>
    <td>${v.shipping_address}</td>
    <td>₹ ${v.rate_per_quintal}</td>
    <td>₹ ${v.total_amount}</td>
    <td>₹ ${v.advance_payment}</td>
    <td>₹ ${v.remaining_payment}</td>
    <td>
      <span class="status ${v.payment_status}">
        ${v.payment_status}
      </span>
    </td>
    <td>${v.remark || "-"}</td>
    <td>
      <button onclick="toggleTransportHistory('${v.transport_voucher_no}', this)">
        View History
      </button>
    </td>
  </tr>

  <!-- EXPANDABLE HISTORY ROW -->
  <tr id="history-${v.transport_voucher_no}" style="display:none;">
    <td colspan="16">
      <div class="history-container"></div>
    </td>
  </tr>
  `;
}
    if (type === "payment") {
      body.innerHTML += `
        <tr>
          <td>${v.payment_voucher_no}</td>
          <td>${v.party_name}</td>
          <td>${v.address}</td>
          <td>${v.purchase_voucher_no}</td>
          <td>${v.payment_type}</td>
          <td>₹ ${v.amount}</td>
          <td>${v.created_by}</td>
          <td>${new Date(v.created_at).toLocaleString()}</td>
        </tr>
      `;
    }
    if (type === "receipt") {
      body.innerHTML += `
        <tr>
          <td>${v.receipt_voucher_no}</td>
          <td>${v.mill_name}</td>
          <td>${v.mill_address}</td>
          <td>${v.sale_voucher_no}</td>
          <td>${v.bank_name}</td>
          <td>₹ ${v.amount}</td>
          <td>₹ ${v.case_discount}</td>
          <td>₹ ${v.weight_shortage}</td>
          <td>₹ ${v.unloading_charges}</td>
          <td>₹ ${v.brokerage_commission}</td>
          <td>₹ ${v.quality_claim}</td>
          <td>₹ ${v.bank_charges}</td>
          <td>₹ ${v.final_received_amount}</td>
          <td>${v.created_by}</td>
          <td>${new Date(v.created_at).toLocaleString()}</td>
        </tr>
      `;
    }
  });

}

/* OPEN EDIT MODAL */
async function openEditVoucher(id) {

  if (currentType !== "purchase") return;

  editingVoucherId = id;

  const res = await api(`/vouchers/purchase/${id}/items`);
  const data = await res.json();

  const items = data.data;

  const select = document.getElementById("editCommodity");
  select.innerHTML = "";

  items.forEach(item => {
    select.innerHTML += `
      <option value="${item.id}">
        ${item.commodity}
      </option>
    `;
  });

  window.editItems = items;

  loadSelectedEditItem();

  document.getElementById("editVoucherModal").style.display = "flex";
}

function loadSelectedEditItem() {

  const itemId = document.getElementById("editCommodity").value;

  const item = window.editItems.find(i => i.id == itemId);

  editBags.value = item.bags;

  const qtl = Math.floor(item.total_weight_kg / 100);
  const kg = item.total_weight_kg % 100;

  editQuintal.value = qtl;
  editKg.value = kg;
  editRate.value = item.rate_per_kg;
  editCommission.value = item.commission_percent;

  recalcEdit();
}

/* CLOSE MODAL */
function closeEditModal() {
  editingVoucherId = null;
  document.getElementById("editVoucherModal").style.display = "none";
}

/* UPDATE VOUCHER */
async function updateVoucher() {

  const itemId = document.getElementById("editCommodity").value;

  const qtl = Number(editQuintal.value) || 0;
  const kg = Number(editKg.value) || 0;
  const bags = Number(editBags.value) || 0;
  const rate = Number(editRate.value) || 0;
  const commission = Number(editCommission.value) || 0;

  const totalWeightKg = (qtl * 100) + kg;
  const dhaltaKg = (bags * 200) / 1000;
  const finalWeightKg = Math.max(totalWeightKg - dhaltaKg, 0);

  const totalAmount = finalWeightKg * rate;
  const commissionAmount = totalAmount * commission / 100;
  const finalAmount = totalAmount - commissionAmount;

  const payload = {
    item_id: itemId,
    itemData: {
      bags,
      total_weight_kg: totalWeightKg,
      wajan_dhalta_kg: dhaltaKg,
      final_weight_kg: finalWeightKg,
      rate_per_kg: rate,
      total_amount: totalAmount,
      commission_percent: commission,
      commission_amount: commissionAmount,
      final_amount: finalAmount
    }
  };

  await api(`/vouchers/purchase/${editingVoucherId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  closeEditModal();
  loadVouchers("purchase");
}

/* REVERSE VOUCHER */
async function reverseVoucher(id) {
  if (!confirm("Reverse this voucher? Ledger & stock will be adjusted.")) return;

  await api(`/vouchers/purchase/${id}/reverse`, {
    method: "POST"
  });

  loadVouchers("purchase");
}

async function toggleItems(voucherId, btn) {

  const row = document.getElementById(`items-${voucherId}`);

  if (row.style.display === "none") {
    row.style.display = "table-row";
    btn.innerText = "Hide Items";

    const res = await api(`/vouchers/purchase/${voucherId}/items`);
    const data = await res.json();

    const container = row.querySelector(".item-container");

    let html = `
      <table class="inner-table">
        <tr>
          <th>Commodity</th>
          <th>HSN</th>
          <th>Bags</th>
          <th>Total Weight</th>
          <th>Wajan Dhalta</th>
          <th>Final Weight</th>
          <th>Rate</th>
          <th>Commission</th>
          <th>Final Amount</th>
        </tr>
    `;

    data.data.forEach(item => {
      html += `
        <tr>
          <td>${item.commodity}</td>
          <td>${item.hsn_no || "-"}</td>
          <td>${item.bags}</td>
          <td>${item.total_weight_kg}</td>
          <td>${item.wajan_dhalta_kg}</td>
          <td>${item.final_weight_kg}</td>
          <td>${item.rate_per_kg}</td>
          <td>${item.commission_amount}</td>
          <td>${item.final_amount}</td>
        </tr>
      `;
    });

    html += "</table>";

    container.innerHTML = html;

  } else {
    row.style.display = "none";
    btn.innerText = "View Items";
  }
}

async function toggleTransportHistory(voucherNo, btn) {

  const row = document.getElementById(`history-${voucherNo}`);

  if (row.style.display === "none") {

    row.style.display = "table-row";
    btn.innerText = "Hide History";

    const res = await api(`/vouchers/transport/history/${voucherNo}`);
    const data = await res.json();

    const container = row.querySelector(".history-container");

    if (!data.data || data.data.length === 0) {
      container.innerHTML = "<p>No payment history found</p>";
      return;
    }

    let html = `
      <table class="inner-table">
        <tr>
          <th>Payment No</th>
          <th>Payment Type</th>
          <th>Amount</th>
          <th>Date</th>
        </tr>
    `;

    data.data.forEach(p => {
      html += `
        <tr>
          <td>${p.payment_no}</td>
          <td>${p.payment_type}</td>
          <td>₹ ${p.amount}</td>
          <td>${new Date(p.created_at).toLocaleString()}</td>
        </tr>
      `;
    });

    html += "</table>";

    container.innerHTML = html;

  } else {

    row.style.display = "none";
    btn.innerText = "View History";
  }
}
function recalcEdit() {
  const bags = Number(editBags.value) || 0;
  const qtl = Number(editQuintal.value) || 0;
  const kg = Number(editKg.value) || 0;
  const rate = Number(editRate.value) || 0;
  const commissionPercent = Number(editCommission.value) || 0;

  const totalWeightKg = (qtl * 100) + kg;
  const dhaltaKg = (bags * 200) / 1000;
  const finalWeightKg = Math.max(totalWeightKg - dhaltaKg, 0);

  const grossAmount = finalWeightKg * rate;
  const commissionAmt = grossAmount * commissionPercent / 100;
  const finalAmount = grossAmount - commissionAmt;

  // 🔥 IMPORTANT FIXES
  editDhalta.value = dhaltaKg.toFixed(2);
  editFinalWeight.innerText = finalWeightKg.toFixed(2);
  editCommissionAmount.innerText = commissionAmt.toFixed(2);
  editFinalAmount.innerText = finalAmount.toFixed(2);
}

let editingSaleId = null;

function openEditSale(id) {
  const v = currentVouchers.find(x => x.id === id);
  editingSaleId = id;

  editSaleWeight.value = v.final_weight_kg;
  editSaleRate.value = v.rate_per_kg;
  editSaleAmount.innerText = v.final_amount;

  document.getElementById("editSaleModal").style.display = "flex";
}

function closeEditSale() {
  document.getElementById("editSaleModal").style.display = "none";
}

async function updateSale() {

  const weight = Number(editSaleWeight.value);
  const rate = Number(editSaleRate.value);
  const amount = weight * rate;

  await api(`/vouchers/sale/${editingSaleId}`, {
    method: "PUT",
    body: JSON.stringify({
      total_weight_kg: weight,
      final_weight_kg: weight,
      rate_per_kg: rate,
      total_amount: amount,
      final_amount: amount
    })
  });

  closeEditSale();
  loadVouchers("sale");
}

async function reverseSale(id) {
  if (!confirm("Reverse this sale voucher?")) return;

  await api(`/vouchers/sale/${id}/reverse`, { method: "POST" });

  loadVouchers("sale");
}
function printSaleSlip(id) {
  window.open(
    `http://localhost:3000/api/vouchers/sale/${id}/print`,
    "_blank"
  );
}

async function saveSaleSlip(id) {

  const res = await api(`/vouchers/sale/${id}/save`, {
    method: "POST"
  });

  const data = await res.json();

  if (data.status === "success") {
    alert("PDF saved successfully!\n\nLocation:\n" + data.path);
  } else {
    alert("Error saving PDF");
  }
}
