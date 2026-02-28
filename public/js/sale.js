let mills = [];
let selectedMillId = null;

/* LOAD MILLS */
async function loadMills() {
  const res = await api("/parties");
  const data = await res.json();

  mills = data.data.filter(p =>
    p.party_type === "mill" || p.party_type === "both"
  );
}
loadMills();

/* SEARCH MILL */
document.getElementById("millSearch").addEventListener("input", function () {

  const q = this.value.toLowerCase();
  const list = document.getElementById("millList");
  list.innerHTML = "";

  if (!q) return;

  mills
    .filter(m => m.name.toLowerCase().includes(q))
    .forEach(m => {
      const div = document.createElement("div");
      div.innerText = m.name;
      div.onclick = () => selectMill(m);
      list.appendChild(div);
    });

});

/* SELECT MILL */
function selectMill(mill) {

  selectedMillId = mill.id;

  document.getElementById("millSearch").value = mill.name;

  document.getElementById("millGst").innerText =
    mill.gstn || "-";

  document.getElementById("millState").innerText =
    mill.state || "-";

  // 🔥 AUTO BILLING ADDRESS
  const fullAddress =
    (mill.address || "") + ", " +
    (mill.district || "") + ", " +
    (mill.state || "") + " - " +
    (mill.pincode || "");

  document.getElementById("billingAddress").value = fullAddress;

  document.getElementById("millList").innerHTML = "";
}
/* live stock */
let commodities = [];

/* LOAD COMMODITIES FROM STOCK TABLE */
async function loadCommodities() {

  const res = await api("/stock");   // GET all stock
  const data = await res.json();

  commodities = data.data || [];

  const select = document.getElementById("commoditySelect");
  select.innerHTML = `<option value="">Select Commodity</option>`;

  commodities.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.commodity;
    opt.textContent = c.commodity;
    select.appendChild(opt);
  });

}
loadCommodities();

function selectCommodity(name) {

  const commodity = commodities.find(c => c.commodity === name);

  if (!commodity) {
    document.getElementById("hsnDisplay").innerText = "-";
    document.getElementById("availableStockKg").innerText = "0 Kg";
    document.getElementById("availableStockKg1").innerText = "0 Kg";

    return;
  }

  // Show HSN
  document.getElementById("hsnDisplay").innerText =
    commodity.hsn_no || "-";

  // Convert quintal to KG
  const stockQtl = Number(commodity.quantity) || 0;
  // const stockKg = stockQtl * 100;

  document.getElementById("availableStockKg").innerText =
    stockQtl.toFixed(2) + " Kg";
  document.getElementById("availableStockKg1").innerText =
    stockQtl.toFixed(2) + " Kg";

}
let brokers = [];
async function loadBrokers() {

  const res = await api("/brokers");
  const data = await res.json();

  brokers = data.data || [];

  const select = document.getElementById("brokerSelect");
  select.innerHTML = `<option value="">Select Broker</option>`;

  brokers.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.broker_name;
    select.appendChild(opt);
  });

}

loadBrokers();
function selectBroker(id) {

  const broker = brokers.find(b => b.id == id);

  if (!broker) {
    document.getElementById("brokerCompany").innerText = "-";
    document.getElementById("brokerMobile").innerText = "-";
    return;
  }

  document.getElementById("brokerCompany").innerText =
    broker.company_name || "-";

  document.getElementById("brokerMobile").innerText =
    broker.mobile_primary || "-";
}
let transports = [];

async function loadTransports() {

  const res = await api("/transports");
  const data = await res.json();

  transports = data.data || [];

  const select = document.getElementById("transportSelect");
  select.innerHTML = `<option value="">Select Transport</option>`;

  transports.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.company_name;
    select.appendChild(opt);
  });
}

loadTransports();

function formatMobile(input) {
  input.value = input.value
    .replace(/\D/g, "")
    .slice(0, 10);
}

function formatVehicle(input) {
  input.value = input.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

function calculateFreight() {

  const quintal =
    (Number(document.getElementById("saleQtl").value) || 0) +
    (Number(document.getElementById("saleKg").value) || 0) / 100;

  const rate =
    Number(document.getElementById("freightRate").value) || 0;

  const advance =
    Number(document.getElementById("freightAdvance").value) || 0;

  const totalFreight = quintal * rate;
  const remaining = totalFreight - advance;

  document.getElementById("freightTotal").value =
    totalFreight.toFixed(2);

  document.getElementById("freightRemaining").value =
    remaining.toFixed(2);

}

async function loadFreightSources() {

  const type = freightPaymentType.value;

  freightCashSection.style.display = "none";
  freightBankSection.style.display = "none";

  if (type === "cash") {

    freightCashSection.style.display = "block";

    const res = await api("/cash");
    const data = await res.json();

    freightCashSelect.innerHTML = "";

    data.data.forEach(c => {
      freightCashSelect.innerHTML += `
        <option value="${c.cash_id}">
          ${c.cash_id} - ₹${c.remaining_amount}
        </option>`;
    });
  }

  if (type === "bank") {

    freightBankSection.style.display = "block";

    const res = await api("/banks");
    const data = await res.json();

    freightBankSelect.innerHTML = "";

    data.data.forEach(b => {
      freightBankSelect.innerHTML += `
        <option value="${b.id}">
          ${b.bank_name}
        </option>`;
    });

    loadFreightBankEntries();
  }
}

async function loadFreightBankEntries() {

  const res = await api(
    `/banks/${freightBankSelect.value}/history`
  );

  const data = await res.json();

  freightBankEntry.innerHTML = "";

  data.data
    .filter(e => e.remaining_amount > 0)
    .forEach(e => {
      freightBankEntry.innerHTML += `
        <option value="${e.id}">
          ${e.voucher_no}
          - ₹${e.remaining_amount}
        </option>`;
    });
}

function calculateSale() {

  const quintal = Number(document.getElementById("saleQtl").value) || 0;
  const kg = Number(document.getElementById("saleKg").value) || 0;
  const rate = Number(document.getElementById("saleRate").value) || 0;

  const totalWeightKg = (quintal * 100) + kg;
  const finalAmount = totalWeightKg * rate;

  document.getElementById("saleFinalWeight").innerText =
    totalWeightKg.toFixed(2) + " Kg";

  document.getElementById("saleFinalAmount").innerText =
    finalAmount.toFixed(2);

  calculateFreight();
}

/* SAVE SALE */
async function saveSale() {

  if (!selectedMillId) {
    alert("Select Mill");
    return;
  }

  const mill = mills.find(m => m.id === selectedMillId);

  const broker = brokers.find(b => b.id == brokerSelect.value);
  const transport = transports.find(t => t.id == transportSelect.value);

  const driverName = document.getElementById("driverName").value.trim();
  const driverMobile = document.getElementById("driverMobile").value.trim();
  const vehicleNo = document.getElementById("vehicleNo").value.trim();
  const quintal = Number(saleQtl.value) || 0;
  const kg = Number(saleKg.value) || 0;
  const rate = Number(saleRate.value) || 0;

  const totalWeightKg = (quintal * 100) + kg;
  const finalAmount = totalWeightKg * rate;

  const payload = {
    party_id: selectedMillId,
    party_name: mill.name,
    gst_no: mill.gstn || "",
    place_of_supply: mill.state,

    bags: Number(document.getElementById("saleBags").value) || 0,

    billing_address: document.getElementById("billingAddress").value,
    shipping_address: document.getElementById("shippingAddress").value,

    broker_id: broker?.id || null,
    broker_name: broker?.broker_name || "",
    broker_company: broker?.company_name || "",

    transport_id: transport?.id || null,
    transport_name: transport?.company_name || "",

    driver_name: driverName,
    driver_mobile: driverMobile,
    vehicle_no: vehicleNo,

    bilty_no: document.getElementById("biltyNo").value,
    freight_rate_per_qtl: Number(document.getElementById("freightRate").value) || 0,
    freight_total: Number(document.getElementById("freightTotal").value) || 0,
    freight_advance: Number(document.getElementById("freightAdvance").value) || 0,
    freight_remaining: Number(document.getElementById("freightRemaining").value) || 0,
    freight_remark: document.getElementById("freightRemark").value,

    freight_payment_type: freightPaymentType.value,
    freight_bank_id: freightBankSelect.value || null,
    freight_bank_entry_id: freightBankEntry.value || null,
    freight_cash_id: freightCashSelect.value || null,

    commodity: commoditySelect.value,
    hsn_no: hsnDisplay.innerText,

    total_weight_kg: totalWeightKg,
    final_weight_kg: totalWeightKg,
    rate_per_kg: rate,
    total_amount: finalAmount,
    final_amount: finalAmount
  };
  await api("/vouchers/sale", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  alert("Sale Voucher Created Successfully");

  // ✅ RESET FORM
  resetSaleForm();
}
function resetSaleForm() {

  // Clear mill
  selectedMillId = null;
  document.getElementById("millSearch").value = "";
  document.getElementById("millGst").innerText = "-";
  document.getElementById("millState").innerText = "-";

  // Clear addresses
  document.getElementById("billingAddress").value = "";
  document.getElementById("shippingAddress").value = "";
  document.getElementById("sameAsBilling").checked = false;

  // Clear dropdowns
  document.getElementById("commoditySelect").value = "";
  document.getElementById("brokerSelect").value = "";
  document.getElementById("transportSelect").value = "";
  document.getElementById("driverName").value = "";
  document.getElementById("driverMobile").value = "";
  document.getElementById("vehicleNo").value = "";
  document.getElementById("brokerCompany").innerText = "-";
  document.getElementById("brokerMobile").innerText = "-";
  document.getElementById("driverMobile").innerText = "-";

  // Clear weight inputs
  document.getElementById("saleQtl").value = "";
  document.getElementById("saleKg").value = "";
  document.getElementById("saleRate").value = "";
  document.getElementById("saleBags").value = "";

  document.getElementById("biltyNo").value = "";
  document.getElementById("freightRate").value = "";
  document.getElementById("freightTotal").value = "";
  document.getElementById("freightAdvance").value = "";
  document.getElementById("freightRemaining").value = "";
  document.getElementById("freightRemark").value = "";


  // Reset summary
  document.getElementById("saleFinalWeight").innerText = "0 Kg";
  document.getElementById("saleFinalAmount").innerText = "0.00";
  document.getElementById("availableStockKg").innerText = "0 Kg";
  document.getElementById("availableStockKg1").innerText = "0 Kg";
  document.getElementById("hsnDisplay").innerText = "-";
}


document.getElementById("sameAsBilling")
  .addEventListener("change", function () {

    const billing = document.getElementById("billingAddress");
    const shipping = document.getElementById("shippingAddress");

    if (this.checked) {
      shipping.value = billing.value;
      shipping.setAttribute("readonly", true);
    } else {
      shipping.value = "";
      shipping.removeAttribute("readonly");
    }

  });
function openTransportModalFromSale() {

  const title = document.getElementById("transportModalTitle");
  const modal = document.getElementById("transportModal");

  if (!modal) {
    alert("Transport modal not found in this page.");
    return;
  }

  if (title) {
    title.innerText = "🚛 Add Transport Company";
  }

  editTransportId = null;

  if (typeof resetTransportForm === "function") {
    resetTransportForm();
  }

  modal.style.display = "grid";
};

function openStep(stepNumber) {

  document.querySelectorAll(".sale-step-content")
    .forEach(sec => sec.style.display = "none");

  document.querySelectorAll(".voucher-card")
    .forEach(card => card.classList.remove("active"));

  document.getElementById("step-" + stepNumber)
    .style.display = "block";

  document.querySelectorAll(".voucher-card")[stepNumber - 1]
    .classList.add("active");
};

loadMills();
