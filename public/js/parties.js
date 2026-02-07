
let currentLedger = [];
function renderLedger(rows, partyType) {
  let totalDebit = 0;
  let totalCredit = 0;

  const tbody = document.getElementById("historyTable");
  tbody.innerHTML = "";

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No transactions</td></tr>`;
  }

  rows.forEach(r => {
    const debit = Number(r.debit) || 0;
    const credit = Number(r.credit) || 0;

    totalDebit += debit;
    totalCredit += credit;

    tbody.innerHTML += `
      <tr>
        <td>${new Date(r.created_at).toLocaleDateString()}</td>
        <td>${r.entry_type}</td>
        <td>${debit > 0 ? "₹ " + debit.toFixed(2) : "-"}</td>
        <td>${credit > 0 ? "₹ " + credit.toFixed(2) : "-"}</td>
      </tr>
    `;
  });

  let balance = totalDebit - totalCredit;

  partyType = partyType?.toLowerCase();

  if (partyType === "farmer") {
    // Labels
    document.getElementById("leftLabel").innerText = "Total Purchased";
    document.getElementById("rightLabel").innerText = "Total Paid";

    // Values
    document.getElementById("payable").innerText =
      "₹ " + totalDebit.toFixed(2);

    document.getElementById("received").innerText =
      "₹ " + totalCredit.toFixed(2);

  } else if (partyType === "mill") {
    document.getElementById("leftLabel").innerText = "Total Sale";
    document.getElementById("rightLabel").innerText = "Total Received";

    document.getElementById("payable").innerText =
      "₹ " + totalDebit.toFixed(2);

    document.getElementById("received").innerText =
      "₹ " + totalCredit.toFixed(2);
  }

  document.getElementById("balance").innerText =
    "₹ " + balance.toFixed(2);
}


async function loadPartyDetails(partyId, partyName) {
  document.getElementById("partyTitle").innerText =
    `📖 ${partyName} (ID: ${partyId})`;

  const res = await api(`/ledger/${partyId}`);
  const data = await res.json();

  if (!data.data) {
    renderLedger([], null);
    return;
  }

  // 👉 fetch party type from backend (source of truth)
  const partyRes = await api(`/parties/${partyId}`);
  const partyData = await partyRes.json();

  renderLedger(data.data, partyData.data.party_type);
}
function renderParties(list) {
  const box = document.getElementById("partyCards");
  box.innerHTML = "";

  list.forEach(p => {
    box.innerHTML += `
      <div class="party-card ${p.is_active === 0 ? "inactive" : ""}"
           onclick="loadPartyDetails(${p.id}, '${p.name}', '${p.party_type}')">

        <!-- 👆 NAME ONLY = POPUP -->
        <div class="party-name"
             onclick="event.stopPropagation(); openPartyPopup(${p.id}, '${p.party_type}')">
          <b>#${p.id} ${p.name}</b>
        </div>

        <span class="badge ${p.party_type}">
          ${p.party_type.toUpperCase()}
        </span>

        <div class="actions">
          <button onclick="event.stopPropagation(); editParty(${p.id}, '${p.name}', '${p.party_type}')">✏️</button>
          <button onclick="event.stopPropagation(); deleteParty(${p.id})">🗑</button>
        </div>

      </div>
    `;
  });
}
let allParties = [];

async function loadParties() {
  const res = await api("/parties");
  const data = await res.json();
  allParties = data.data;
  renderParties(allParties);
}

function renderParties(list) {
  const box = document.getElementById("partyCards");
  box.innerHTML = "";

  list.forEach(p => {
    box.innerHTML += `
      <div class="party-card ${p.is_active === 0 ? "inactive" : ""}"
           onclick="loadPartyDetails(${p.id}, '${p.name}', '${p.party_type}')">

        <!-- NAME CLICK → POPUP -->
        <div class="party-name"
             onclick="event.stopPropagation(); openPartyPopup(${p.id}, '${p.party_type}')">
          <b>#${p.id} ${p.name}</b>
        </div>

        <span class="badge ${p.party_type}">
          ${p.party_type.toUpperCase()}
        </span>

        <div class="actions">
          <button onclick="event.stopPropagation(); editParty(${p.id}, '${p.name}', '${p.party_type}')">✏️</button>
          <button onclick="event.stopPropagation(); deleteParty(${p.id})">🗑</button>
        </div>
      </div>
    `;
  });
}
let editPartyId = null;

function editParty(id, name, type) {
  editPartyId = id;
  openAddParty();
  document.getElementById("partyName").value = name;
  document.getElementById("partyType").value = type;
}

function filterParties() {
  const q = document.getElementById("partySearch").value.toLowerCase();
  const filtered = allParties.filter(p =>
    p.name.toLowerCase().includes(q)
  );
  renderParties(filtered);
}
function openAddParty() {
  document.getElementById("partyModal").style.display = "flex";
}

function closeAddParty() {
  document.getElementById("partyModal").style.display = "none";
}

async function saveParty() {
  const name = partyName.value.trim();
  const type = partyType.value;

  if (!name || !type) {
    alert("Party name & type required");
    return;
  }

  const payload = {
    name,
    party_type: type
  };

  // 👨‍🌾 Farmer
  if (type === "farmer") {
    payload.mobile = mobile.value.trim();
    payload.address = address.value.trim();
  }

  // 🏭 Mill
  if (type === "mill") {
    const gstn = document.getElementById("gstn").value.trim();

    if (!isValidGSTN(gstn)) {
      alert("Invalid GST number");
      return;
    }

    payload.gstn = gstn;
    payload.company_name =
      document.getElementById("companyName").value.trim();
    payload.address =
      document.getElementById("companyAddress").value.trim();
    payload.state =
      document.getElementById("state").value.trim();
      payload.district =
      document.getElementById("district").value.trim();

    const pin = document.getElementById("pincode").value.trim();

if (!/^[0-9]{6}$/.test(pin)) {
  alert("Invalid pincode");
  return;
}

payload.pincode = pin; // KEEP AS STRING

  }

  const res = await api("/parties", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const d = await res.json();

  if (!res.ok) {
    alert(d.message || "Error saving party");
    return;
  }

  closeAddParty();
  await loadParties();
}

async function deleteParty(id) {
  if (!confirm("Deactivate this party?")) return;

  await api(`/parties/${id}`, { method: "DELETE" });
  await loadParties();
}

function togglePartyFields() {
  const type = document.getElementById("partyType").value;

  document.getElementById("farmerFields").style.display =
    type === "farmer" ? "block" : "none";

  document.getElementById("millFields").style.display =
    type === "mill" ? "block" : "none";
}


async function loadFarmerDetails(partyId) {
  try {
    const res = await api(`/parties/${partyId}`);

    if (!res.ok) {
      console.error("Failed to load farmer details");
      return;
    }

    const d = await res.json();

    if (!d.data || d.data.party_type.toLowerCase() !== "farmer") return;

    document.getElementById("fmName").innerText =
      d.data.name || "-";

    document.getElementById("fmMobile").innerText =
      d.data.mobile || "-";

    document.getElementById("fmAddress").innerText =
      d.data.address || "-";

    document.getElementById("farmerModal").style.display = "flex";

  } catch (err) {
    console.error("Farmer popup error:", err);
  }
}
async function loadMillDetails(partyId) {
  const modal = document.getElementById("millModal");

  if (!modal) {
    console.error("millModal not found in DOM");
    return;
  }

  const res = await api(`/parties/${partyId}`);
  if (!res.ok) return;

  const d = await res.json();
  if (!d.data) return;

  document.getElementById("mmCompany").innerText = d.data.company_name || "-";
  document.getElementById("mmGSTN").innerText = d.data.gstn || "-";
  document.getElementById("mmAddress").innerText = d.data.address || "-";
  document.getElementById("mmDistrict").innerText = d.data.district || "-";
  document.getElementById("mmState").innerText = d.data.state || "-";
  document.getElementById("mmPincode").innerText = d.data.pincode || "-";

  // 🔥 FORCE SHOW
  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("farmerModal").style.display = "none";
}
function closeMillModal() {
  const modal = document.getElementById("millModal");
  if (modal) modal.style.display = "none";
}
async function showFarmerPopup(partyId) {
  try {
    const res = await api(`/parties/${partyId}`);
    const d = await res.json();

    if (!d.data) return;

    if (d.data.party_type.toLowerCase() !== "farmer") return;

    document.getElementById("fmName").innerText = d.data.name || "-";
    document.getElementById("fmMobile").innerText = d.data.mobile || "-";
    document.getElementById("fmAddress").innerText = d.data.address || "-";

    document.getElementById("farmerModal").style.display = "flex";
  } catch (e) {
    console.error("Popup error", e);
  }
}

function isValidGSTN(gstn) {
  const gstRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  return gstRegex.test(gstn);
}
function openPartyPopup(partyId, partyType) {
  if (!partyType) return;

  const type = partyType.toLowerCase().trim();

  console.log("POP CLICK:", partyId, type); // DEBUG

  if (type === "farmer") {
    loadFarmerDetails(partyId);
  }

  if (type === "mill") {
    loadMillDetails(partyId);
  }
}


loadParties();
