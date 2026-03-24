let commodities = [];
let items = [];

/* LOAD FARMERS */
let parties = [];
document.getElementById("purchaseDate").max =
  new Date().toISOString().split("T")[0];


  
async function loadFarmers() {

  const res = await api("/parties");
  const data = await res.json();

  // Farmer + Trader allowed
  parties = data.data.filter(p =>
    p.party_type === "farmer" ||
    p.party_type === "trader"
  );

} loadFarmers();
/* FARMER SEARCH */
document.getElementById("farmerSearch").addEventListener("input", function () {

  const q = this.value.toLowerCase();
  const list = document.getElementById("farmerList");
  list.innerHTML = "";

  if (!q) return;

  parties
    .filter(p => p.name.toLowerCase().includes(q))
    .forEach(p => {

      const div = document.createElement("div");
      div.className = "dropdown-item";

      const typeIcon =
        p.party_type === "farmer" ? "🌾" : "🏪";

      div.innerText = `${typeIcon} ${p.name}`;

      div.onclick = () => selectParty(p);

      list.appendChild(div);

    });

});
function selectParty(party) {

  document.getElementById("farmerSearch").value = party.name;

  document.getElementById("party_id").value = party.id;

  document.getElementById("farmer_mobile").value =
    party.mobile || "";

  document.getElementById("farmer_address").value =
    party.address || "";

  if (party.party_type === "trader") {

    document.getElementById("party_gst").parentElement.style.display = "block";
    document.getElementById("party_pan").parentElement.style.display = "block";

  } else {

    document.getElementById("party_gst").parentElement.style.display = "none";
    document.getElementById("party_pan").parentElement.style.display = "none";

  }

  document.getElementById("party_gst").value =
    party.gstn || "";

  document.getElementById("party_pan").value =
    party.pan || "";
  document.getElementById("farmerList").innerHTML = "";

}
/* LOAD COMMODITIES */
async function loadCommodities() {

  const res = await api("/stock");
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

function selectCommodity(value) {

  const selected = commodities.find(c => c.commodity === value);

  if (selected) {
    document.getElementById("hsn_no").value = selected.hsn_no || "";
  } else {
    document.getElementById("hsn_no").value = "";
  }
}
/* SHOW FORM */
function showCommodityForm() {
  document.getElementById("commodityForm").style.display = "block";
}

/* ADD ITEM */
function addCommodityItem() {

  const commodity = document.getElementById("commodity").value;
  const bags = Number(document.getElementById("bags").value) || 0;
  const quintal = Number(document.getElementById("quintal").value) || 0;
  const kg = Number(document.getElementById("kg").value) || 0;
  const rate = Number(document.getElementById("rate").value) || 0;
  const commissionPercent = Number(document.getElementById("commission").value) || 0;
  const dhaltaGram = Number(document.getElementById("wajan_dhalta_input").value) || 0;

  if (!commodity || rate <= 0) {
    alert("Select commodity and enter rate");
    return;
  }

  const totalWeight = (quintal * 100) + kg;
  const dhaltaKg = (bags * dhaltaGram) / 1000;
  const finalWeight = totalWeight - dhaltaKg;
  const totalAmount = finalWeight * rate;
  const commissionAmount = totalAmount * commissionPercent / 100;
  const finalAmount = totalAmount - commissionAmount;

  items.push({
    commodity,
    hsn_no: document.getElementById("hsn_no").value,
    bags,
    total_weight_kg: totalWeight,
    wajan_dhalta_kg: dhaltaKg,
    final_weight_kg: finalWeight,
    rate_per_kg: rate,
    total_amount: totalAmount,
    commission_percent: commissionPercent,
    commission_amount: commissionAmount,
    final_amount: finalAmount
  });

  renderSummary();
  resetCommodityForm();
}

async function toggleUnloadPayment() {

  const type =
    document.getElementById("unloadPaymentType").value;

  document.getElementById("unloadCashSection").style.display =
    type === "cash" ? "block" : "none";

  document.getElementById("unloadBankSection").style.display =
    type === "bank" ? "block" : "none";

  if (type === "cash") loadUnloadCash();

  if (type === "bank") loadUnloadBanks();

};


async function loadUnloadCash() {

  const res = await api("/cash");
  const data = await res.json();

  const select =
    document.getElementById("unloadCashId");

  select.innerHTML = `<option value="">Select Cash</option>`;

  data.data.forEach(c => {

    select.innerHTML += `
<option value="${c.cash_id}">
${c.cash_id} - ₹ ${Number(c.remaining_amount).toFixed(2)}
</option>
`;

  });

};


async function loadUnloadBanks() {

  const res = await api("/banks");
  const data = await res.json();

  const select =
    document.getElementById("unloadBankId");

  select.innerHTML =
    `<option value="">Select Bank</option>`;

  data.data.forEach(b => {

    select.innerHTML += `
<option value="${b.id}">
${b.bank_name} (₹ ${Number(b.balance).toFixed(2)})
</option>
`;

  });

};

async function loadUnloadBankEntries() {

  const bankId =
    document.getElementById("unloadBankId").value;

  if (!bankId) return;

  const res =
    await api(`/banks/${bankId}/history`);

  const data = await res.json();

  const select =
    document.getElementById("unloadBankEntryId");

  select.innerHTML =
    `<option value="">Select Bank Entry</option>`;

  data.data.forEach(e => {

    if (Number(e.remaining_amount) > 0) {

      select.innerHTML += `
<option value="${e.id}">
${e.voucher_no} - ₹ ${Number(e.remaining_amount).toFixed(2)}
</option>
`;

    }

  });

};

/* RESET FORM */
function resetCommodityForm() {
  document.getElementById("commodity").value = "";
  document.getElementById("bags").value = "";
  document.getElementById("quintal").value = "";
  document.getElementById("kg").value = "";
  document.getElementById("rate").value = "";
  document.getElementById("commission").value = "";
  document.getElementById("wajan_dhalta_input").value = "";
  document.getElementById("commodityForm").style.display = "none";
  document.getElementById("gaddiNo").value = "";
  document.getElementById("unloadingCharge").value = "";

}

/* RENDER SUMMARY */
function renderSummary() {
  const unloadingCharge =
    Number(document.getElementById("unloadingCharge").value) || 0;

  const gaddiNo =
    document.getElementById("gaddiNo").value || "";
  let html = "";
  let totalWeight = 0;
  let totalDhalta = 0;
  let totalGross = 0;
  let totalCommission = 0;
  let totalFinal = 0;

  items.forEach((item, i) => {

    html += `
      <div style="padding:8px;border-bottom:1px solid #ddd;">
        <b>${i + 1}. ${item.commodity}</b>
        | Final Weight: ${item.final_weight_kg.toFixed(2)} Kg
        | Final Amount: ₹ ${item.final_amount.toFixed(2)}
      </div>
    `;

    totalWeight += item.total_weight_kg;
    totalDhalta += item.wajan_dhalta_kg;
    totalGross += item.total_amount;
    totalCommission += item.commission_amount;
    totalFinal += item.final_amount;
  });

  document.getElementById("commoditySummary").innerHTML = html;

  totalWeightEl.innerText = totalWeight.toFixed(2) + " Kg";
  dhaltaEl.innerText = totalDhalta.toFixed(2) + " Kg";
  finalWeightEl.innerText = (totalWeight - totalDhalta).toFixed(2) + " Kg";
  grossAmountEl.innerText = totalGross.toFixed(2);
  discountEl.value = totalCommission.toFixed(2);
  const finalPayable = totalFinal - unloadingCharge;
  netAmountEl.innerText = finalPayable.toFixed(2);
}

/* SAVE PURCHASE */
async function savePurchase() {

  if (!party_id.value) {
    alert("Select farmer");
    return;
  }

  if (items.length === 0) {
    alert("Add at least one commodity");
    return;
  }

  await api("/vouchers/purchase", {
    method: "POST",
    body: JSON.stringify({

      // ✅ NEW DATE FIELD
      purchase_date: document.getElementById("purchaseDate").value,

      party_id: Number(party_id.value),
      vehicle_no: vehicle_no.value,
      gaddi_no: document.getElementById("gaddiNo").value,

      unloading_charge:
        Number(document.getElementById("unloadingCharge").value),

      unload_payment_type:
        document.getElementById("unloadPaymentType").value,

      unload_cash_id:
        document.getElementById("unloadCashId").value,

      unload_bank_id:
        document.getElementById("unloadBankId").value,

      unload_bank_entry_id:
        document.getElementById("unloadBankEntryId").value,

      items
    })
  });
  alert("Voucher Created Successfully");
  location.reload();
}

function openSection(sectionId, element) {

  document.querySelectorAll(".voucher-card")
    .forEach(card => card.classList.remove("active"));

  element.classList.add("active");

  document.querySelectorAll(".form-section")
    .forEach(sec => sec.classList.remove("active-section"));

  document.getElementById(sectionId)
    .classList.add("active-section");
}


/* SUMMARY ELEMENTS */
const totalWeightEl = document.getElementById("totalWeight");
const dhaltaEl = document.getElementById("dhalta");
const finalWeightEl = document.getElementById("finalWeight");
const grossAmountEl = document.getElementById("grossAmount");
const discountEl = document.getElementById("discount");
const netAmountEl = document.getElementById("netAmount");