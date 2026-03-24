let currentVouchers = [];
let currentType = "";
let editingVoucherId = null;

/* SORT VARIABLES */
let sortColumn = null;
let sortDirection = "asc";



function sortTable(column) {

  if (sortColumn === column) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortColumn = column;
    sortDirection = "asc";
  }

  currentVouchers.sort((a, b) => {

    let valA = a[column];
    let valB = b[column];

    if (valA == null) valA = "";
    if (valB == null) valB = "";

    /* date */
    if (column.includes("date") || column.includes("created")) {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    /* number */
    else if (!isNaN(valA) && !isNaN(valB)) {
      valA = Number(valA);
      valB = Number(valB);
    }

    /* string */
    else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;

    return 0;

  });

  loadSortedVouchers();
  updateSortIcons();

};





function loadSortedVouchers() {

  const body = document.getElementById("voucherBody");
  body.innerHTML = "";

  if (currentType === "purchase") {
    filterPurchase("all");
    return;
  }

  if (currentType === "payment") {
    filterPayment("all");
    return;
  }

  /* other vouchers */

  currentVouchers.forEach(v => {
    renderVoucherRow(v);
  });

};


function renderVoucherRow(v) {

  const body = document.getElementById("voucherBody");

  if (currentType === "sale") {

    body.innerHTML += `
<tr>
<td>${v.voucher_no}</td>
<td>${v.order_no}</td>
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
<td>${v.modified_at ? new Date(v.modified_at).toLocaleString() : "-"}</td>
<td>
${!v.is_reversed
        ? `
<button onclick="openEditSale(${v.id})">✏️</button>
<button onclick="reverseSale(${v.id})">↩</button>
<button onclick="printSaleSlip(${v.id})">🖨</button>
<button onclick="saveSaleSlip(${v.id})">💾</button>
`
        : `<span class="muted">Reversed</span>`
      }
</td>
</tr>
`;
  }

  if (currentType === "transport") {

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
<td>${v.payment_status}</td>
<td>${v.remark || "-"}</td>

<td>
<button onclick="toggleTransportHistory(${v.id}, this)">
View
</button>
</td>

</tr>

<!-- 🔥 ADD THIS -->
<tr id="history-${v.id}" style="display:none;">
<td colspan="16">
<div class="history-container"></div>
</td>
</tr>
`;

  }
  if (currentType === "receipt") {

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
<td>₹ ${v.transport_charges}</td>
<td>₹ ${v.bank_charges}</td>
<td>₹ ${v.final_received_amount}</td>
<td>${v.created_by}</td>
<td>${new Date(v.created_at).toLocaleString()}</td>
</tr>
`;
  }

};

function updateSortIcons() {

  document
    .querySelectorAll("#voucherHead th")
    .forEach(th => {
      th.innerHTML = th.innerHTML.replace(" ↑", "").replace(" ↓", "");
    });

  const columnMap = document.querySelector(`[data-column="${sortColumn}"]`);

  if (columnMap) {

    columnMap.innerHTML += sortDirection === "asc" ? " ↑" : " ↓";

  }

};


function exportToExcel() {

  if (currentVouchers.length === 0) {
    alert("No data to export");
    return;
  }

  let csv = "";

  const headers = Object.keys(currentVouchers[0]);
  csv += headers.join(",") + "\n";

  currentVouchers.forEach(row => {
    let values = headers.map(h => `"${row[h] || ""}"`);
    csv += values.join(",") + "\n";
  });

  let blob = new Blob([csv], { type: "text/csv" });

  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = currentType + "_vouchers.csv";

  link.click();

};

function filterPurchase(type) {

  const body = document.getElementById("voucherBody");
  body.innerHTML = "";

  let list = currentVouchers;

  if (type === "farmer") {
    list = currentVouchers.filter(v => !v.gst_no);
  }

  if (type === "trader") {
    list = currentVouchers.filter(v => v.gst_no);
  }

  list.forEach(v => {

    body.innerHTML += `
    <tr class="${v.is_reversed ? "reversed" : ""}">
      <td>${v.voucher_no}</td>
      <td>${v.gaddi_no}</td>
     <td>${v.party_name}</td>

<td>
  ${v.gst_no
        ? `<span class="badge trader">🏪 Trader</span>`
        : `<span class="badge farmer">🌾 Farmer</span>`
      }
</td>

<td>${v.mobile || "-"}</td>
<td>${v.gst_no || "-"}</td>

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
  ${currentType === "purchase" && !v.is_reversed
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

  });

};

function filterPayment(type) {

  const body = document.getElementById("voucherBody");
  body.innerHTML = "";

  let list = currentVouchers;

  if (type === "farmer") {
    list = currentVouchers.filter(v => !v.gst_no);
  }

  if (type === "trader") {
    list = currentVouchers.filter(v => v.gst_no);
  }

  list.forEach(v => {

    body.innerHTML += `
<tr>
<td>${v.payment_voucher_no}</td>

<td>${v.party_name}</td>

<td>
${v.party_type === "trader"
        ? `<span class="badge trader">🏪 Trader</span>`
        : `<span class="badge farmer">🌾 Farmer</span>`
      }
</td>

<td>${v.gst_no || "-"}</td>
<td>${v.address}</td>
<td>${v.purchase_voucher_no}</td>
<td>${v.payment_type}</td>
<td>₹ ${v.amount}</td>
<td>${v.created_by}</td>
<td>${new Date(v.created_at).toLocaleString()}</td>

<td>
<button onclick="togglePaymentItems(${v.id}, this)">
View Items
</button>
</td>

</tr>

<!-- 🔥 ADD THIS (IMPORTANT) -->
<tr id="payment-items-${v.id}" style="display:none;">
<td colspan="12">
<div class="item-container"></div>
</td>
</tr>
`;

  });
};

async function loadVouchers(type) {

  const purchaseFilters = document.getElementById("purchaseFilters");
  const paymentFilters = document.getElementById("paymentFilters");

  purchaseFilters.style.display = "none";
  paymentFilters.style.display = "none";

  if (type === "purchase") {
    purchaseFilters.style.display = "block";
  }

  if (type === "payment") {
    paymentFilters.style.display = "block";
  }
  document.getElementById("voucherTitle").innerText =
    type.toUpperCase() + " Vouchers";

  const head = document.getElementById("voucherHead");
  const body = document.getElementById("voucherBody");

  // 🔁 COMMON HEAD FOR ALL
  if (type === "purchase") {
    head.innerHTML = `
<tr>
<th onclick="sortTable('voucher_no')" data-column="voucher_no">
Voucher No<br></th>

<th onclick="sortTable('gaddi_no')" data-column="gaddi_no">
Gaddi No<br>
</th>

<th onclick="sortTable('party_name')" data-column="party_name">
Party<br>
</th>

<th>Type</th>

<th onclick="sortTable('mobile')" data-column="mobile">
Mobile<br>
</th>

<th onclick="sortTable('gst_no')" data-column="gst_no">
GST No<br>
</th>

<th>Voucher Type</th>
<th>Commodity</th>

<th onclick="sortTable('created_at')" data-column="created_at">
Date<br>
</th>

<th onclick="sortTable('total_bags')" data-column="total_bags">
Bags<br>
</th>

<th onclick="sortTable('vehicle_no')" data-column="vehicle_no">
Vehicle<br>
</th>

<th onclick="sortTable('total_commission')" data-column="total_commission">
Commission<br>
</th>

<th onclick="sortTable('unloading_charge')" data-column="unloading_charge">
Unloading<br>
</th>

<th onclick="sortTable('total_wajan_dhalta_kg')" data-column="total_wajan_dhalta_kg">
Wajan Dhalta<br>
</th>

<th onclick="sortTable('total_weight_kg')" data-column="total_weight_kg">
Total Weight<br>
</th>

<th onclick="sortTable('total_final_weight_kg')" data-column="total_final_weight_kg">
Final Weight<br>
</th>

<th onclick="sortTable('total_amount')" data-column="total_amount">
Total Amount<br>
</th>

<th onclick="sortTable('total_final_amount')" data-column="total_final_amount">
Final Amount<br>
</th>

<th>Modified</th>
<th>Action</th>
</tr>
`;
  }
  if (type === "sale") {
    head.innerHTML = `
    <tr>
<th onclick="sortTable('voucher_no')" data-column="voucher_no">Voucher No</th>
<th onclick="sortTable('order_no')" data-column="order_no">Order No</th>
<th onclick="sortTable('party_id')" data-column="party_id">Mill ID</th>
<th onclick="sortTable('party_name')" data-column="party_name">Mill Name</th>
<th onclick="sortTable('gst_no')" data-column="gst_no">GST</th>
<th onclick="sortTable('billing_address')" data-column="billing_address">Billing Address</th>
<th onclick="sortTable('shipping_address')" data-column="shipping_address">Shipping Address</th>
<th onclick="sortTable('place_of_supply')" data-column="place_of_supply">Place</th>
<th onclick="sortTable('commodity')" data-column="commodity">Commodity</th>
<th onclick="sortTable('hsn_no')" data-column="hsn_no">HSN</th>
<th onclick="sortTable('bags')" data-column="bags">Bags</th>
<th onclick="sortTable('final_weight_kg')" data-column="final_weight_kg">Weight</th>
<th onclick="sortTable('rate_per_kg')" data-column="rate_per_kg">Rate</th>
<th onclick="sortTable('final_amount')" data-column="final_amount">Amount</th>
<th onclick="sortTable('broker_name')" data-column="broker_name">Broker</th>
<th onclick="sortTable('broker_company')" data-column="broker_company">Referred</th>
<th onclick="sortTable('transport_name')" data-column="transport_name">Transport</th>
<th onclick="sortTable('driver_mobile')" data-column="driver_mobile">Driver Mobile</th>
<th onclick="sortTable('created_at')" data-column="created_at">Created</th>
<th onclick="sortTable('modified_at')" data-column="modified_at">Modified</th>
<th>Action</th>
</tr>
  `;
  }

  if (type === "transport") {
    head.innerHTML = `
    <tr>
<th onclick="sortTable('transport_voucher_no')" data-column="transport_voucher_no">Transport Voucher</th>
<th onclick="sortTable('bilty_no')" data-column="bilty_no">Bilty No</th>
<th onclick="sortTable('transport_name')" data-column="transport_name">Transport</th>
<th onclick="sortTable('driver_name')" data-column="driver_name">Driver</th>
<th onclick="sortTable('driver_mobile')" data-column="driver_mobile">Mobile</th>
<th onclick="sortTable('vehicle_no')" data-column="vehicle_no">Vehicle</th>
<th onclick="sortTable('sale_voucher_no')" data-column="sale_voucher_no">Sale Voucher</th>
<th onclick="sortTable('mill_name')" data-column="mill_name">Mill</th>
<th onclick="sortTable('shipping_address')" data-column="shipping_address">Shipping</th>
<th onclick="sortTable('rate_per_quintal')" data-column="rate_per_quintal">Rate</th>
<th onclick="sortTable('total_amount')" data-column="total_amount">Total</th>
<th onclick="sortTable('advance_payment')" data-column="advance_payment">Advance</th>
<th onclick="sortTable('remaining_payment')" data-column="remaining_payment">Remaining</th>
<th onclick="sortTable('payment_status')" data-column="payment_status">Status</th>
<th onclick="sortTable('remark')" data-column="remark">Remark</th>
<th>History</th>
</tr>
  `;
  }

  if (type === "payment") {

    head.innerHTML = `
     <tr>
<th onclick="sortTable('payment_voucher_no')" data-column="payment_voucher_no">Payment No</th>
<th onclick="sortTable('party_name')" data-column="party_name">Party</th>
<th onclick="sortTable('party_type')" data-column="party_type">Type</th>
<th onclick="sortTable('gst_no')" data-column="gst_no">GST</th>
<th onclick="sortTable('address')" data-column="address">Address</th>
<th onclick="sortTable('purchase_voucher_no')" data-column="purchase_voucher_no">Purchase Voucher</th>
<th onclick="sortTable('payment_type')" data-column="payment_type">Payment Type</th>
<th onclick="sortTable('amount')" data-column="amount">Amount</th>
<th onclick="sortTable('created_by')" data-column="created_by">Created By</th>
<th onclick="sortTable('created_at')" data-column="created_at">Date</th>
<th>View</th>
</tr>
    `;
  }
  if (type === "receipt") {

    head.innerHTML = `
      <tr>
<th onclick="sortTable('receipt_voucher_no')" data-column="receipt_voucher_no">Receipt No</th>
<th onclick="sortTable('mill_name')" data-column="mill_name">Mill</th>
<th onclick="sortTable('mill_address')" data-column="mill_address">Address</th>
<th onclick="sortTable('sale_voucher_no')" data-column="sale_voucher_no">Sale Voucher</th>
<th onclick="sortTable('bank_name')" data-column="bank_name">Bank</th>
<th onclick="sortTable('amount')" data-column="amount">Total Amount</th>
<th onclick="sortTable('case_discount')" data-column="case_discount">Case Discount</th>
<th onclick="sortTable('weight_shortage')" data-column="weight_shortage">Weight Shortage</th>
<th onclick="sortTable('unloading_charges')" data-column="unloading_charges">Unloading</th>
<th onclick="sortTable('brokerage_commission')" data-column="brokerage_commission">Brokerage</th>
<th onclick="sortTable('quality_claim')" data-column="quality_claim">Quality Claim</th>
<th onclick="sortTable('transport_charges')" data-column="transport_charges">Transport</th>
<th onclick="sortTable('bank_charges')" data-column="bank_charges">Bank Charges</th>
<th onclick="sortTable('final_received_amount')" data-column="final_received_amount">Final Amount</th>
<th onclick="sortTable('created_by')" data-column="created_by">Created By</th>
<th onclick="sortTable('created_at')" data-column="created_at">Date</th>
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

<td>
  ${v.gst_no
          ? `<span class="badge trader">🏪 Trader</span>`
          : `<span class="badge farmer">🌾 Farmer</span>`
        }
</td>

<td>${v.mobile || "-"}</td>
<td>${v.gst_no || "-"}</td>

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
  ${currentType === "purchase" && !v.is_reversed
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
        <td>${v.order_no}</td>
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
      <button onclick="toggleTransportHistory(${v.id}, this)">
        View History
      </button>
    </td>
  </tr>

  <!-- EXPANDABLE HISTORY ROW -->
  <tr id="history-${v.id}" style="display:none;">
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

<td>
${v.party_type === "trader"
          ? `<span class="badge trader">🏪 Trader</span>`
          : `<span class="badge farmer">🌾 Farmer</span>`
        }
</td>

<td>${v.gst_no || "-"}</td>

<td>${v.address}</td>

<td>${v.purchase_voucher_no}</td>

<td>${v.payment_type}</td>

<td>₹ ${v.amount}</td>

<td>${v.created_by}</td>

<td>${new Date(v.created_at).toLocaleString()}</td>

<td>
<button onclick="togglePaymentItems(${v.id}, this)">
          View Items
</button>
</td>

</tr>

<tr id="payment-items-${v.id}" style="display:none;">
<td colspan="12">
<div class="item-container"></div>
</td>
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
          <td>₹ ${v.transport_charges}</td>
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
};

async function togglePaymentItems(id, btn) {

  const row = document.getElementById(`payment-items-${id}`);

  if (!row) {
    console.error("Row not found:", id);
    return;
  }

  if (row.style.display === "none") {

    row.style.display = "table-row";
    btn.innerText = "Hide Items";

    /* find voucher */
    const v = currentVouchers.find(x => x.id === id);

    const res = await api(`/vouchers/purchase/by-voucher/${v.purchase_voucher_no}/items`);
    const data = await res.json();

    const container = row.querySelector(".item-container");

    if (!data.data || data.data.length === 0) {
      container.innerHTML = "<p>No items found</p>";
      return;
    }

    let html = `
<table class="inner-table">
<tr>
<th>Commodity</th>
<th>HSN</th>
<th>Bags</th>
<th>Total Weight</th>
<th>Final Weight</th>
<th>Rate</th>
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
<td>${item.final_weight_kg}</td>
<td>${item.rate_per_kg}</td>
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

};
async function toggleTransportHistory(id, btn) {

  const row = document.getElementById(`history-${id}`);

  if (!row) {
    console.error("Row not found:", id);
    return;
  }

  if (row.style.display === "none") {

    row.style.display = "table-row";
    btn.innerText = "Hide History";

    /* find voucher */
    const v = currentVouchers.find(x => x.id === id);

    const res = await api(`/vouchers/transport/history/${v.transport_voucher_no}`);
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
};

function searchVouchers() {

  const keyword =
    document.getElementById("voucherSearch")
      .value
      .toLowerCase();

  const rows =
    document.querySelectorAll("#voucherBody tr");

  rows.forEach(row => {

    const text =
      row.innerText.toLowerCase();

    row.style.display =
      text.includes(keyword) ? "" : "none";

  });

};
