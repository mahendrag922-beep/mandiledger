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
let transportDrivers = [];
let transportVehicles = [];

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

async function selectTransport(id) {

  if (!id) return;

  const res = await api(`/transports/${id}`);
  const data = await res.json();

  transportDrivers = data.data.drivers || [];
  transportVehicles = data.data.vehicles || [];

  // Load drivers
  const driverSelect = document.getElementById("driverSelect");
  driverSelect.innerHTML = `<option value="">Select Driver</option>`;

  transportDrivers.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.driver_name;
    driverSelect.appendChild(opt);
  });

  // Load vehicles
  const vehicleSelect = document.getElementById("vehicleSelect");
  vehicleSelect.innerHTML = `<option value="">Select Vehicle</option>`;

  transportVehicles.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.vehicle_no;
    opt.textContent = v.vehicle_no;
    vehicleSelect.appendChild(opt);
  });

  // Reset
  document.getElementById("driverMobile").innerText = "-";
}
function selectDriver(id) {

  const driver = transportDrivers.find(d => d.id == id);

  if (!driver) {
    document.getElementById("driverMobile").innerText = "-";
    return;
  }

  document.getElementById("driverMobile").innerText =
    driver.mobile || "-";
}

function openAddDriver() {

  const transportId = document.getElementById("transportSelect").value;

  if (!transportId) {
    alert("Select transport company first");
    return;
  }

  const name = prompt("Enter Driver Name:");
  const mobile = prompt("Enter Driver Mobile:");

  if (!name || !mobile) return;

  api(`/transports/${transportId}/driver`, {
    method: "POST",
    body: JSON.stringify({
      driver_name: name,
      mobile: mobile
    })
  }).then(() => {
    alert("Driver added successfully");
    selectTransport(transportId); // reload drivers
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

  const quintal = Number(saleQtl.value) || 0;
  const kg = Number(saleKg.value) || 0;
  const rate = Number(saleRate.value) || 0;

  const totalWeightKg = (quintal * 100) + kg;
  const finalAmount = totalWeightKg * rate;

  const payload = {
    party_id: selectedMillId,
    party_name: mill.name,
    gst_no: mill.gstn || "",
    address: `${mill.address || ""}, ${mill.district || ""}, ${mill.state || ""} - ${mill.pincode || ""}`,
    place_of_supply: mill.state,

    broker_id: broker?.id || null,
    broker_name: broker?.broker_name || "",
    broker_company: broker?.company_name || "",

    transport_id: transport?.id || null,
    transport_name: transport?.company_name || "",
    driver_mobile: driverMobile.innerText,
    vehicle_no: vehicleSelect.value,

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
}
loadMills();
