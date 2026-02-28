

async function loadSources() {

  const dir = direction.value;
  const type = payment_type.value;

  const bankSection = document.getElementById("bankSection");
  const cashSection = document.getElementById("cashSection");
  const bankEntryWrapper = document.getElementById("bankEntryWrapper");

  // ==============================
  // 🔵 COLLECT FROM MILL
  // ==============================
  if (dir === "received") {

    payment_type.value = "bank";
    payment_type.disabled = true;

    bankSection.style.display = "block";
    cashSection.style.display = "none";

    // 🔥 Hide only bank entry dropdown
    bankEntryWrapper.style.display = "none";
    if (dir === "received") {

      document.getElementById("millAdjustments").style.display = "block";

    } else {

      document.getElementById("millAdjustments").style.display = "none";
    }


    await loadBanks();

    return;
  }

  // ==============================
  // 🔴 PAY TO FARMER
  // ==============================
  if (dir === "paid") {

    payment_type.disabled = false;
    if (dir === "received") {

      document.getElementById("millAdjustments").style.display = "block";

    } else {

      document.getElementById("millAdjustments").style.display = "none";
    }

    if (type === "bank") {

      bankSection.style.display = "block";
      cashSection.style.display = "none";

      bankEntryWrapper.style.display = "block";

      await loadBanks();
      await loadBankEntries();

    } else {

      bankSection.style.display = "none";
      cashSection.style.display = "block";

      await loadCash();
    }
  }

}

function recalcMillAmount() {

  const total = Number(amount.value) || 0;

  const caseDiscount = Number(case_discount.value) || 0;
  const weightShortage = Number(weight_shortage.value) || 0;
  const unloading = Number(unloading_charges.value) || 0;
  const brokerage = Number(brokerage_commission.value) || 0;
  const quality = Number(quality_claim.value) || 0;
  const bankCharges = Number(bank_charges.value) || 0;

  const totalDeductions =
    caseDiscount +
    weightShortage +
    unloading +
    brokerage +
    quality +
    bankCharges;

  const finalAmount = total - totalDeductions;

  document.getElementById("final_received_amount").innerText =
    finalAmount.toFixed(2);
}

async function loadBanks() {

  const res = await api("/banks");
  const data = await res.json();

  bankSelect.innerHTML = "";

  data.data.forEach(b => {
    bankSelect.innerHTML += `
      <option value="${b.id}">
        ${b.bank_name}
      </option>`;
  });

  // 🔥 AUTO LOAD ENTRIES FOR FIRST BANK
  if (data.data.length > 0) {
    bankSelect.value = data.data[0].id;
    loadBankEntries();
  }
}

async function loadBankEntries() {

  if (!bankSelect.value) return;

  const res = await api(`/banks/${bankSelect.value}/history`);
  const data = await res.json();

  bankEntrySelect.innerHTML = "";

  const usable = data.data.filter(e => Number(e.remaining_amount) > 0);

  if (usable.length === 0) {
    bankEntrySelect.innerHTML =
      `<option value="">No usable amount</option>`;
    return;
  }

  usable.forEach(e => {
    bankEntrySelect.innerHTML += `
      <option value="${e.id}">
        ${e.voucher_no} (₹ ${Number(e.remaining_amount).toFixed(2)})
      </option>`;
  });
}

async function loadCash() {
  const res = await api("/cash");
  const data = await res.json();

  cashSelect.innerHTML = "";
  data.data.forEach(c => {
    cashSelect.innerHTML += `
      <option value="${c.cash_id}">
        ${c.cash_id} - ₹${c.remaining_amount}
      </option>`;
  });
}

async function savePayment() {

  if (!direction.value) {
    alert("Select from outstanding list first");
    return;
  }

  const payload = {
    party_id: +party_id.value,
    voucher_no: voucher_no.value,
    amount: +amount.value,
    payment_type: payment_type.value,
    direction: direction.value,
    bank_id: bankSelect.value || null,
    source_id:
      payment_type.value === "bank"
        ? bankEntrySelect.value
        : cashSelect.value,
    party_name: party_name.value || null,
    case_discount: +case_discount?.value || 0,
    weight_shortage: +weight_shortage?.value || 0,
    unloading_charges: +unloading_charges?.value || 0,
    brokerage_commission: +brokerage_commission?.value || 0,
    quality_claim: +quality_claim?.value || 0,
    bank_charges: +bank_charges?.value || 0

  };

  const res = await api("/payments", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert("Error");
    return;
  }

  alert("Payment Successful");
  location.reload();
}
function fillPaymentForm(
  partyId,
  partyName,
  voucherNo,
  amt,
  dir
) {

  party_id.value = partyId;
  party_name.value = partyName;
  voucher_no.value = voucherNo;
  amount.value = amt;

  if (dir === "received") {

    direction.value = "received";
    payment_type.value = "bank";
    payment_type.disabled = true;

    document.getElementById("millAdjustments").style.display = "block";
  }

  else if (dir === "paid") {

    direction.value = "paid";
    payment_type.disabled = false;
    payment_type.value = "cash";

    document.getElementById("millAdjustments").style.display = "none";
  }

  else if (dir === "transport") {

    direction.value = "paid";   // 🔥 internally paid
    payment_type.disabled = false;
    payment_type.value = "cash";

    document.getElementById("millAdjustments").style.display = "none";

    // 🔥 Change label dynamically
    direction.options[0].text = "Paid (to Transport)";
  }

  loadSources();
}

let allDues = [];

async function loadDueAlerts() {

  const res = await api("/reports/outstanding");
  const data = await res.json();

  allDues = data.data || [];

  renderDueTable("all"); // default load
}

function filterDue(type, element) {

  document.querySelectorAll(".due-voucher-card")
    .forEach(card => card.classList.remove("active"));

  element.classList.add("active");

  renderDueTable(type);
}
function renderDueTable(type) {

  const tbody = document.getElementById("dueTable");
  tbody.innerHTML = "";

  let filtered = allDues;

  if (type !== "all") {
    filtered = allDues.filter(row => row.party_type === type);
  }

  if (filtered.length === 0) {
    tbody.innerHTML =
      `<tr><td colspan="5">No dues available</td></tr>`;
    return;
  }

  filtered.forEach(row => {

    const amount = Number(row.balance) || 0;

    let statusText = "";
    let statusClass = "";
    let directionValue = "";

    if (row.party_type === "farmer") {
      statusText = "Pay to Farmer";
      statusClass = "status-red";
      directionValue = "paid";
    }

    else if (row.party_type === "mill") {
      statusText = "Collect from Mill";
      statusClass = "status-green";
      directionValue = "received";
    }

    else if (row.party_type === "transport") {
      statusText = "Pay to Transport";
      statusClass = "status-red";
      directionValue = "transport";
    }

    tbody.innerHTML += `
      <tr onclick="fillPaymentForm(
        ${row.party_id},
        '${row.name}',
        '${row.voucher_no || ""}',
        ${amount},
        '${directionValue}'
      )">
        <td>${row.party_id}</td>
        <td>${row.name}</td>
        <td>${row.voucher_no || "-"}</td>
        <td>₹ ${amount.toFixed(2)}</td>
        <td class="${statusClass}">
          ${statusText}
        </td>
      </tr>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadDueAlerts();
});