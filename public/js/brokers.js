let allBrokers = [];

/* LOAD BROKERS */
async function loadBrokers() {
  const res = await api("/brokers");
  const data = await res.json();

  allBrokers = data.data || [];

  renderBrokers(allBrokers);
}

function renderBrokers(list) {
  const box = document.getElementById("brokerList");
  box.innerHTML = "";

  list.forEach(b => {
    box.innerHTML += `
      <div class="broker-card">
        <div onclick="loadBrokerDetails(${b.id})">
          <b>${b.broker_name}</b>
        </div>

        <div class="broker-actions">
          <button onclick="editBroker(${b.id})">✏️</button>
          <button onclick="deleteBroker(${b.id})">🗑</button>
        </div>
      </div>
    `;
  });
}

/* SEARCH */
function filterBrokers() {
  const q = brokerSearch.value.toLowerCase();
  const filtered = allBrokers.filter(b =>
    b.broker_name.toLowerCase().includes(q)
  );
  renderBrokers(filtered);
}

/* LOAD DETAILS */
async function loadBrokerDetails(id) {
  const res = await api(`/brokers/${id}`);
  const data = await res.json();
  const b = data.data;

  brokerTitle.innerText = `📖 ${b.broker_name}`;

  detailCompany.innerText = b.company_name || "-";

  detailMobile1.innerText =
    "Primary: " + (b.mobile_primary || "-");

  detailMobile2.innerText =
    "Alternate: " + (b.mobile_alt || "-");

  detailAddress.innerText = b.address || "-";

  detailLocation.innerText =
    `${b.district || ""}, ${b.state || ""} - ${b.pincode || ""}`;
}

/* MODAL */
function openBrokerModal() {
  brokerModal.style.display = "flex";
}

function closeBrokerModal() {
  brokerModal.style.display = "none";
}

/* SAVE BROKER */
async function saveBroker() {
  const payload = {
    broker_name: broker_name.value.trim(),
    company_name: company_name.value.trim(),
    mobile_primary: mobile_primary.value.trim(),
    mobile_alt: mobile_alt.value.trim(),
    address: address.value.trim(),
    district: district.value.trim(),
    state: state.value.trim(),
    pincode: pincode.value.trim()
  };

  if (!payload.broker_name) {
    alert("Broker name required");
    return;
  }

  let url = "/brokers";
  let method = "POST";

  if (editingBrokerId) {
    url = `/brokers/${editingBrokerId}`;
    method = "PUT";
  }

  await api(url, {
    method,
    body: JSON.stringify(payload)
  });

  editingBrokerId = null;

  closeBrokerModal();
  await loadBrokers();


  // reset form
  document.querySelectorAll("#brokerModal input").forEach(i => i.value = "");
}
let editingBrokerId = null;

async function editBroker(id) {
  const res = await api(`/brokers/${id}`);
  const data = await res.json();
  const b = data.data;

  editingBrokerId = id;

  broker_name.value = b.broker_name;
  company_name.value = b.company_name;
  mobile_primary.value = b.mobile_primary;
  mobile_alt.value = b.mobile_alt;
  address.value = b.address;
  district.value = b.district;
  state.value = b.state;
  pincode.value = b.pincode;

  openBrokerModal();
}
async function deleteBroker(id) {
  if (!confirm("Are you sure to delete this broker?")) return;

  await api(`/brokers/${id}`, {
    method: "DELETE"
  });

  await loadBrokers();
}

loadBrokers();
