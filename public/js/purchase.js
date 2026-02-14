
// loadFarmers();
let farmers = [];

/* LOAD FARMERS */
async function loadFarmers() {
  const res = await api("/parties");
  const data = await res.json();

  farmers = data.data.filter(p => p.party_type === "farmer");
}
loadFarmers();

/* FARMER SEARCH */
document.getElementById("farmerSearch").addEventListener("input", function () {
  const q = this.value.toLowerCase();
  const list = document.getElementById("farmerList");
  list.innerHTML = "";

  if (!q) return;

  farmers
    .filter(f => f.name.toLowerCase().includes(q))
    .forEach(f => {
      const div = document.createElement("div");
      div.className = "dropdown-item";
      div.innerText = f.name;
      div.onclick = () => selectFarmer(f);
      list.appendChild(div);
    });
});

function selectFarmer(farmer) {
  farmerSearch.value = farmer.name;
  party_id.value = farmer.id;
  farmer_mobile.value = farmer.mobile || "";
  farmer_address.value = farmer.address || "";
  farmerList.innerHTML = "";
}
/* live stock */
let commodities = [];

/* LOAD COMMODITIES FROM STOCK TABLE */
async function loadCommodities() {

  const res = await api("/stock");   // GET all stock
  const data = await res.json();

  commodities = data.data || [];

  const select = document.getElementById("commodity");
  select.innerHTML = `<option value="">Select Commodity</option>`;

  commodities.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.commodity;
    opt.textContent = c.commodity;
    select.appendChild(opt);
  });

}
loadCommodities();

/* CALCULATION */
function calculatePurchase() {
  const quintal = Number(quintalInput.value) || 0;
  const kg = Number(kgInput.value) || 0;
  const bags = Number(bagsInput.value) || 0;
  const rate = Number(rateInput.value) || 0;
  const commissionPercent = Number(commissionInput.value) || 0;

  const totalWeightKg = (quintal * 100) + kg;
  const wajanDhaltaKg = (bags * 200) / 1000;
  const finalWeightKg = Math.max(totalWeightKg - wajanDhaltaKg, 0);

  const grossAmount = finalWeightKg * rate;
  const commissionAmount = grossAmount * commissionPercent / 100;
  const netAmount = grossAmount - commissionAmount;

  totalWeight.innerText = totalWeightKg.toFixed(2) + " Kg";
totalWeight.dataset.value = totalWeightKg;

dhalta.innerText = wajanDhaltaKg.toFixed(2) + " Kg";
dhalta.dataset.value = wajanDhaltaKg;

finalWeight.innerText = finalWeightKg.toFixed(2) + " Kg";
finalWeight.dataset.value = finalWeightKg;

grossAmountSpan.innerText = grossAmount.toFixed(2);
grossAmountSpan.dataset.value = grossAmount;

netAmountSpan.innerText = netAmount.toFixed(2);
netAmountSpan.dataset.value = netAmount;
 discount.value = commissionAmount.toFixed(2);
}

/* ELEMENT SHORTCUTS */
const quintalInput = document.getElementById("quintal");
const kgInput = document.getElementById("kg");
const bagsInput = document.getElementById("bags");
const rateInput = document.getElementById("rate");
const commissionInput = document.getElementById("commission");

const totalWeight = document.getElementById("totalWeight");
const dhalta = document.getElementById("dhalta");
const finalWeight = document.getElementById("finalWeight");
const grossAmountSpan = document.getElementById("grossAmount");
const netAmountSpan = document.getElementById("netAmount");

/* SAVE PURCHASE (VOUCHER READY) */
async function savePurchase() {
  if (!party_id.value) {
    alert("Select farmer");
    return;
  }

  const payload = {
    party_id: Number(party_id.value),
    commodity: commodity.value,

    bags: Number(bagsInput.value),
    vehicle_no: vehicle_no.value,

    total_weight_kg: Number(totalWeight.dataset.value),
    wajan_dhalta_kg: Number(dhalta.dataset.value),
    final_weight_kg: Number(finalWeight.dataset.value),

    rate_per_kg: Number(rateInput.value),

    total_amount: Number(grossAmountSpan.dataset.value),
    commission_percent: Number(commissionInput.value),
    commission_amount: Number(discount.value),
    final_amount: Number(netAmountSpan.dataset.value)
  };

  // 🛑 VALIDATION
  if (payload.final_weight_kg <= 0 || payload.rate_per_kg <= 0) {
    alert("Invalid weight or rate");
    return;
  }

  await api("/vouchers/purchase", {
  method: "POST",
  body: JSON.stringify(payload)
});

  alert("✅ Purchase voucher created successfully");

}
