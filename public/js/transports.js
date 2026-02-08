let currentTransport = null;
let editTransportId = null;
let allTransports = [];

async function loadTransports() {
  try {
    const res = await api("/transports");
    const json = await res.json();

    allTransports = json.data || [];
    renderTransports(allTransports);

  } catch (err) {
    console.error("Failed to load transports", err);
  }
}
function renderTransports(list) {
  const box = document.getElementById("transportCards");
  box.innerHTML = "";

  if (list.length === 0) {
    box.innerHTML = "<p>No transport companies found</p>";
    return;
  }

  list.forEach(t => {
    const div = document.createElement("div");
    div.className = "party-card";
    div.onclick = () => loadTransportDetails(t.id, t.company_name);

    div.innerHTML = `
      <b>#${t.id} ${t.company_name}</b><br>
      <span class="badge both">TRANSPORT</span>
      <small>Modified: ${t.modified_at ? new Date(t.modified_at).toLocaleString() : "-"}</small>

      <div class="actions">
        <button onclick="event.stopPropagation(); editTransport(${t.id})">✏️</button>
        <button onclick="event.stopPropagation(); deleteTransport(${t.id})">🗑</button>
      </div>

    `;

    box.appendChild(div);
  });
}


async function loadTransport(id) {
  const res = await api(`/transports/${id}`);
  const d = await res.json();
  currentTransport = d.data;

  transportTitle.innerText = currentTransport.company_name;

  // drivers
  driverSelect.innerHTML = `<option value="">Select Driver</option>`;
  currentTransport.drivers.forEach(dr => {
    driverSelect.innerHTML += `
      <option value="${dr.id}" data-mobile="${dr.mobile}">
        ${dr.driver_name}
      </option>
    `;
  });

  // vehicles
  vehicleSelect.innerHTML = `<option value="">Select Vehicle</option>`;
  currentTransport.vehicles.forEach(v => {
    vehicleSelect.innerHTML += `
      <option value="${v.id}" data-tyres="${v.tyres}">
        ${v.vehicle_no}
      </option>
    `;
  });
}

function showDriverMobile() {
  const sel = document.getElementById("driverSelect");
  const mobile = sel.options[sel.selectedIndex]?.dataset.mobile || "—";
  document.getElementById("driverMobile").innerText = mobile;
}

function showVehicleTyres() {
  const sel = document.getElementById("vehicleSelect");
  const tyres = sel.options[sel.selectedIndex]?.dataset.tyres || "—";
  document.getElementById("vehicleTyres").innerText = tyres;
}
// OPEN MODAL
function openTransportModal() {
  document.getElementById("transportModal").style.display = "grid";
}

// CLOSE MODAL
function closeTransportModal() {
  document.getElementById("transportModal").style.display = "none";
}

function validateTransportRows() {
  // 🚚 DRIVERS
  const driverNames = document.querySelectorAll(".driver-name");
  const driverMobiles = document.querySelectorAll(".driver-mobile");

  for (let i = 0; i < driverNames.length; i++) {
    if (
      driverNames[i].value.trim() === "" ||
      driverMobiles[i].value.trim() === ""
    ) {
      alert("❌ Please fill all driver name and mobile fields");
      return false;
    }
  }

  // 🚛 VEHICLES
  const vehicleNumbers = document.querySelectorAll(".vehicle-number");
  const vehicleTyres = document.querySelectorAll(".vehicle-tyres");

  for (let i = 0; i < vehicleNumbers.length; i++) {
    if (
      vehicleNumbers[i].value.trim() === "" ||
      vehicleTyres[i].value.trim() === ""
    ) {
      alert("❌ Please fill all vehicle number and tyre fields");
      return false;
    }
  }

  return true;
}

async function saveTransport() {
  if (!validateTransportRows()) return;

  const companyNameEl = document.getElementById("company_name");
  const companyName = companyNameEl.value.trim();

  // ❌ VALIDATION
  if (!companyName) {
    companyNameEl.style.border = "2px solid #dc2626";
    alert("Company name is required");
    companyNameEl.focus();
    return;
  } else {
    companyNameEl.style.border = "1px solid #e5e7eb";
  }

  const payload = {
    company_name: companyName,
    mobile_primary: mobile_primary.value.trim(),
    mobile_alt: mobile_alt.value.trim(),
    address: address.value.trim(),
    district: district.value.trim(),
    state: state.value.trim(),
    pincode: pincode.value.trim(),
    drivers: [],
    vehicles: []
  };

  
  // vehicles
  // 🔹 DRIVERS (SAFE)
document.querySelectorAll(".driver-row").forEach(row => {
  const name = row.querySelector(".driver-name")?.value.trim();
  const mobile = row.querySelector(".driver-mobile")?.value.trim();

  if (name && mobile) {
    payload.drivers.push({
      id: row.querySelector(".driver-id").value || null,
      driver_name: name,
      mobile: mobile
    });
  }
});

// 🔹 VEHICLES (SAFE)
document.querySelectorAll(".vehicle-row").forEach(row => {
  const number = row.querySelector(".vehicle-number")?.value.trim();
  const tyres = row.querySelector(".vehicle-tyres")?.value.trim();

  if (number && tyres) {
    payload.vehicles.push({
      id: row.querySelector(".vehicle-id").value || null,
      vehicle_no: number,
      tyres: tyres
    });
  }
});

  // API CALL
    const url = editTransportId
    ? `/transports/${editTransportId}`
    : `/transports`;

  const method = editTransportId ? "PUT" : "POST";

  const res = await api(url, {
    method,
    body: JSON.stringify(payload)
  });

  const d = await res.json();
  if (!res.ok) {
    alert(d.message || "Failed to save transport");
    return;
  }
  editTransportId = null;
  // ✅ SUCCESS
  closeTransportModal();
  resetTransportForm();
 
  
await loadTransports();
alert("Transport added successfully");
}

function resetTransportForm() {
  const ids = [
    "company_name",
    "mobile_primary",
    "mobile_alt",
    "address",
    "district",
    "state",
    "pincode"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";   // ✅ SAFE
  });

  // Clear dynamic driver rows
  const driverBox = document.getElementById("driverBox");
  if (driverBox) driverBox.innerHTML = "";

  // Clear dynamic vehicle rows
  const vehicleBox = document.getElementById("vehicleBox");
  if (vehicleBox) vehicleBox.innerHTML = "";
}

function addDriverRow(data = {}) {
  const box = document.getElementById("driversBox");
  if (!box) return;

  const row = document.createElement("div");
  row.className = "row driver-row";
  row.innerHTML = `
    <input type="text" placeholder="Driver Name" class="driver-name" value="${data.driver_name || ""}">
    <input type="text" placeholder="Driver Mobile" class="driver-mobile" value="${data.mobile || ""}" oninput="formatMobile(this)">
    <input type="hidden" class="driver-id" value="${data.id || ""}">
    <button type="button" class="remove-btn" onclick="removeRow(this)">✖</button>
  `;


  box.appendChild(row);
}

function addVehicleRow(data={}) {
  const box = document.getElementById("vehiclesBox");
  if (!box) return;

  const row = document.createElement("div");
  row.className = "row vehicle-row";
    row.innerHTML = `
    <input type="text" placeholder="Vehicle Number" class="vehicle-number" value="${data.vehicle_no || ""}" oninput="formatVehicle(this)">
    <input type="number" placeholder="Tyres" class="vehicle-tyres" value="${data.tyres || ""}">
    <input type="hidden" class="vehicle-id" value="${data.id || ""}">
    <button type="button" class="remove-btn" onclick="removeRow(this)">✖</button>
  `;


  box.appendChild(row);
}

function removeRow(btn) {
  btn.parentElement.remove();
}

function filterTransports() {
  const q = document
    .getElementById("transportSearch")
    .value
    .toLowerCase();

  const filtered = allTransports.filter(t =>
    t.company_name.toLowerCase().includes(q)
  );

  renderTransports(filtered);
}

function filterTransports() {
  const q = document
    .getElementById("transportSearch")
    .value
    .toLowerCase();

  const filtered = allTransports.filter(t =>
    t.company_name.toLowerCase().includes(q)
  );

  renderTransports(filtered);
}

async function loadTransportDetails(id, name) {
  try {
    document.getElementById("transportTitle").innerText =
      `🚛 ${name} (ID: ${id})`;

    const res = await api(`/transports/${id}`);
    const json = await res.json();

    if (!json.data) return;

    const { transport, drivers, vehicles } = json.data;

    /* COMPANY DETAILS */
    document.getElementById("companyMobilePrimary").innerText =
      transport.mobile_primary || "—";
    document.getElementById("companyMobileAlt").innerText =
    transport.mobile_alt || "—";

    document.getElementById("companyDistrict").innerText =
      transport.district || "—";

    document.getElementById("companyPincode").innerText =
      transport.pincode || "—";

    document.getElementById("companyAddress").innerText =
      transport.address || "—";

    /* DRIVER DROPDOWN */
    const driverSelect = document.getElementById("driverSelect");
driverSelect.innerHTML = `<option value="">Select driver</option>`;

drivers.forEach(d => {
  const opt = document.createElement("option");
  opt.value = d.id;
  opt.textContent = d.driver_name;

  // 🔥 attach mobile here
  opt.dataset.mobile = d.mobile || "";

  driverSelect.appendChild(opt);
});

    /* VEHICLE DROPDOWN */
    const vehicleSelect = document.getElementById("vehicleSelect");
vehicleSelect.innerHTML = `<option value="">Select vehicle</option>`;

vehicles.forEach(v => {
  const opt = document.createElement("option");
  opt.value = v.id;
  opt.textContent = v.vehicle_no;

  // 🔥 attach tyre count
  opt.dataset.tyres = v.tyres || 0;

  vehicleSelect.appendChild(opt);
});

    // Reset dependent fields
    document.getElementById("driverMobile").innerText = "—";
    document.getElementById("vehicleTyres").innerText = "—";

  } catch (err) {
    console.error("❌ Failed to load transport details", err);
  }
}
function formatMobile(input) {
  input.value = input.value
    .replace(/\D/g, "")   // remove non-numbers
    .slice(0, 10);        // max 10 digits
}
function formatVehicle(input) {
  input.value = input.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")   // only A-Z & 0-9
    .slice(0, 10);               // limit length
}
async function editTransport(id) {
  editTransportId = id;

  const res = await api(`/transports/${id}`);
  const json = await res.json();
  const t = json.data.transport || json.data;

  // Company fields
  document.getElementById("company_name").value = t.company_name;
  document.getElementById("mobile_primary").value = t.mobile_primary || "";
  document.getElementById("mobile_alt").value = t.mobile_alt || "";
  document.getElementById("address").value = t.address || "";
  document.getElementById("district").value = t.district || "";
  document.getElementById("state").value = t.state || "";
  document.getElementById("pincode").value = t.pincode || "";

  // Drivers
  document.getElementById("driversBox").innerHTML = "";
  json.data.drivers.forEach(d => addDriverRow(d));

  // Vehicles
  document.getElementById("vehiclesBox").innerHTML = "";
  json.data.vehicles.forEach(v => addVehicleRow(v));
  
  document.getElementById("transportModalTitle").innerText = "Edit Transport";

  openTransportModal();
}
async function deleteTransport(id) {
  if (!confirm("Delete this transport company?")) return;

  const res = await api(`/transports/${id}`, { method: "DELETE" });
  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Delete failed");
    return;
  }

  loadTransports();
}

loadTransports();
