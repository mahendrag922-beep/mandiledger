let currentVouchers = [];
let currentType = "";
let editingVoucherId = null;

async function loadVouchers(type) {
  document.getElementById("voucherTitle").innerText =
    type.toUpperCase() + " Vouchers";

  const head = document.getElementById("voucherHead");
  const body = document.getElementById("voucherBody");

  // 🔁 COMMON HEAD FOR ALL
  if(type==="purchase"){
    head.innerHTML = `
  <tr>
    <th>Voucher No</th>
    <th>Party</th>
    <th>Mobile</th>
    <th>Type</th>
    <th>Commodity</th>
    <th>Date & Time</th>
    <th>Bags</th>
    <th>Vehicle</th>
    <th>Commission</th>
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
      <th>address</th>
      <th>place of supply</th>
      <th>Commodity</th>
      <th>HSN</th>
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
    if(type === "purchase"){
  body.innerHTML += `
    <tr class="${v.is_reversed ? "reversed" : ""}">
      <td>${v.voucher_no}</td>
      <td>${v.party_name}</td>
      <td>${v.mobile || "-"}</td>
      <td>${type.toUpperCase()}</td>
      <td>${v.commodity}</td>
      <td>${new Date(v.created_at).toLocaleString()}</td>
      <td>${v.bags || 0}</td>
      <td>${v.vehicle_no || "-"}</td>
      <td>₹ ${Number(v.commission_amount || 0).toFixed(2)}</td>
      <td>${Number(v.wajan_dhalta_kg || 0).toFixed(2)} Kg</td>
      <td>${Number(v.total_weight_kg || 0).toFixed(2)}</td>
      <td>${Number(v.final_weight_kg || 0).toFixed(2)}</td>
      <td>₹ ${Number(v.total_amount || 0).toFixed(2)}</td>
      <td>₹ ${Number(v.final_amount || 0).toFixed(2)}</td>
      <td>
        ${v.modified_at ? new Date(v.modified_at).toLocaleString() : "-"}
      </td>
      <td>
        ${
          type === "purchase" && !v.is_reversed
            ? `
             <button class="btn-edit" onclick="openEditVoucher(${v.id})">✏️</button>
              <button class="btn-reverse" onclick="reverseVoucher(${v.id})">↩</button>
              <button onclick="printSlip(${v.id})">🖨 Print</button>
              <button onclick="saveSlip(${v.id})">💾 Save</button>

            `
            : `<span class="muted">—</span>`
        }
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
        <td>${v.address}</td>
        <td>${v.place_of_supply}</td>
        <td>${v.commodity}</td>
        <td>${v.hsn_no}</td>
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
        <td>${
                  type === "sale" && !v.is_reversed 
                  ? `
                       <button onclick="openEditSale(${v.id})">✏️</button>
                       <button onclick="reverseSale(${v.id})">↩</button>
                       <button onclick="printSaleSlip(${v.id})">🖨 Print</button>
                       <button onclick="saveSaleSlip(${v.id})">💾 Save</button>
                       `
                        : `<span class="muted">—</span>`
              }</td>
     </tr>
    `;
  }
});

}

/* OPEN EDIT MODAL */
function openEditVoucher(id) {
  if (currentType !== "purchase") return;

  const v = currentVouchers.find(x => x.id === id);
  if (!v) return alert("Voucher not found");

  editingVoucherId = id;

  // quantity split
  const qtl = Math.floor(v.total_weight_kg / 100);
  const kg = v.total_weight_kg % 100;

  editCommodity.value = v.commodity;     // 🔥 IMPORTANT
  editBags.value = v.bags || 0;
  editQuintal.value = qtl;
  editKg.value = kg;
  editRate.value = v.rate_per_kg;
  editCommission.value = v.commission_percent;

  recalcEdit();

  document.getElementById("editVoucherModal").style.display = "flex";

}

/* CLOSE MODAL */
function closeEditModal() {
  editingVoucherId = null;
  document.getElementById("editVoucherModal").style.display = "none";
}

/* UPDATE VOUCHER */
async function updateVoucher() {
  const v = currentVouchers.find(x => x.id === editingVoucherId);
  if (!v) return alert("Voucher not found");

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
    commodity: editCommodity.value,   // ✅ now NOT NULL
    bags,
    total_weight_kg: totalWeightKg,
    wajan_dhalta_kg: dhaltaKg,
    final_weight_kg: finalWeightKg,
    rate_per_kg: rate,
    total_amount: totalAmount,
    commission_percent: commission,
    commission_amount: commissionAmount,
    final_amount: finalAmount
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

function printSlip(id) {
  window.open(
    `http://localhost:3000/api/vouchers/purchase/${id}/print`,
    "_blank"
  );
}

async function saveSlip(id) {
  const res = await api(`/vouchers/purchase/${id}/save`, {
    method: "POST"
  });

  const data = await res.json();
  alert(data.message);
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
