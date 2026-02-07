let allBrokers = [];

async function loadBrokers() {
  const res = await api("/brokers");
  const d = await res.json();
  allBrokers = d.data;
  renderBrokers(allBrokers);
}

function renderBrokers(list) {
  const box = document.getElementById("brokerCards");
  box.innerHTML = "";

  list.forEach(b => {
    box.innerHTML += `
      <div class="party-card"
           onclick="loadBroker(${b.id})">
        <b>#${b.id} ${b.name}</b>
      </div>
    `;
  });
}

async function loadBroker(id) {
  const res = await api(`/brokers/${id}`);
  const d = await res.json();
  const b = d.data;

  brokerTitle.innerText = b.name;
  brMobile.innerText = b.mobile || "-";
  brState.innerText = b.state || "-";
  brDistrict.innerText = b.district || "-";
  brAddress.innerText = b.address || "-";
  brPincode.innerText = b.pincode || "-";
}

function filterBrokers(q) {
  renderBrokers(
    allBrokers.filter(b =>
      b.name.toLowerCase().includes(q.toLowerCase())
    )
  );
}

function openBrokerModal() {
  brokerModal.style.display = "flex";
}

function closeBrokerModal() {
  brokerModal.style.display = "none";
}

async function saveBroker() {
  await api("/brokers", {
    method: "POST",
    body: JSON.stringify({
      name: brName.value,
      mobile: brMobileInput.value,
      state: brStateInput.value,
      district: brDistrictInput.value,
      pincode: brPincodeInput.value,
      address: brAddressInput.value
    })
  });

  closeBrokerModal();
  loadBrokers();
}

loadBrokers();
