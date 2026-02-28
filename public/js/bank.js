let breadcrumbStack = [];

function updateBreadcrumb() {

  const container = document.getElementById("breadcrumb");
  container.innerHTML = "";

  breadcrumbStack.forEach((item, index) => {

    const span = document.createElement("span");
    span.innerHTML = item.label;
    span.style.cursor = "pointer";

    span.onclick = () => {
      breadcrumbStack = breadcrumbStack.slice(0, index + 1);
      item.action();
      updateBreadcrumb();
    };

    container.appendChild(span);

    if (index < breadcrumbStack.length - 1) {
      const sep = document.createElement("span");
      sep.innerHTML = " ➜ ";
      sep.style.margin = "0 8px";
      container.appendChild(sep);
    }
  });
}


function openBankForm() {
  document.getElementById("bankModal").style.display = "block";
}


async function openTransferForm() {

  const res = await api("/banks");
  const data = await res.json();

  const select = document.getElementById("transferBank");
  select.innerHTML = `<option value="">Select Bank</option>`;

  data.data.forEach(b=>{
    select.innerHTML += `
      <option value="${b.id}">
        ${b.bank_name}
      </option>
    `;
  });

  document.getElementById("transferModal").style.display = "block";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

/* SHOW BANK LIST */
async function showBanks() {

  breadcrumbStack = [
    { label: "Bank", action: showBanks }
  ];
  updateBreadcrumb();

  const res = await api("/banks");
  const data = await res.json();

  let html = `
    <h3>Bank List</h3>
    <table>
      <tr>
        <th>S.No</th>
        <th>Bank</th>
        <th>Balance</th>
        <th>History</th>
      </tr>
  `;

  data.data.forEach((b,i)=>{
    html += `
      <tr>
        <td>${i+1}</td>
        <td>${b.bank_name}</td>
        <td>₹ ${Number(b.balance).toFixed(2)}</td>
        <td><button onclick="loadBankHistory(${b.id}, '${b.bank_name}')">View</button></td>
      </tr>
    `;
  });

  html += "</table>";

  mainContent.innerHTML = html;
}

/* BANK HISTORY */
async function loadBankHistory(bank_id, bank_name) {

  // Prevent duplicate breadcrumb
  const exists = breadcrumbStack.find(b => b.label === bank_name);

  if (!exists) {
    breadcrumbStack.push({
      label: bank_name,
      action: () => loadBankHistory(bank_id, bank_name)
    });
  }

  updateBreadcrumb();

  const res = await api(`/banks/${bank_id}/history`);
  const data = await res.json();

  let html = `
    <h3>${bank_name} - History</h3>
    <table>
      <tr>
        <th>S.No</th>
        <th>Amount</th>
        <th>Voucher</th>
        <th>Remaining Amount</th>
        <th>Mill</th>
        <th>Date</th>
      </tr>
  `;

  data.data.forEach((b,i)=>{
    html += `
      <tr>
        <td>${i+1}</td>
        <td>₹ ${b.total_amount}</td>
        <td><a href ="#" onclick = "loadEntryUsage(${b.id},'${b.voucher_no}')">
        ${b.voucher_no}</a></td>
        <td>${b.remaining_amount}</td>
        <td>${b.mill_name}</td>
        <td>${new Date(b.created_at).toLocaleString()}</td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("mainContent").innerHTML = html;
}

/* SHOW CASH LIST */
async function showCash() {

  breadcrumbStack = [
    { label: "💰 Cash", action: showCash }
  ];
  updateBreadcrumb();

  const res = await api("/cash/all");
  const data = await res.json();

  let html = `
    <h3>Cash IDs</h3>
    <table>
      <tr>
        <th>S.No</th>
        <th>Cash ID</th>
        <th>Total</th>
        <th>Remaining</th>
        <th>History</th>
      </tr>
  `;

  data.data.forEach((c,i)=>{
    html += `
      <tr>
        <td>${i+1}</td>
        <td>${c.cash_id}</td>
        <td>₹ ${c.total_amount}</td>
        <td>₹ ${c.remaining_amount}</td>
        <td>
          <button onclick="loadCashHistory('${c.cash_id}')">
            View
          </button>
        </td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("mainContent").innerHTML = html;
}

/* CASH HISTORY */
async function loadCashHistory(cash_id) {

  // Avoid duplicate breadcrumb
  if (!breadcrumbStack.find(b => b.label === cash_id)) {
    breadcrumbStack.push({
      label: cash_id,
      action: () => loadCashHistory(cash_id)
    });
  }

  updateBreadcrumb();

  const res = await api(`/cash/${cash_id}/history`);
  const data = await res.json();

  let html = `
    <h3>Cash History - ${cash_id}</h3>
    <table>
      <tr>
        <th>S.No</th>
        <th>Party ID</th>
        <th>Voucher</th>
        <th>Amount</th>
        <th>Date</th>
      </tr>
  `;

  data.data.forEach((h,i)=>{
    html += `
      <tr>
        <td>${i+1}</td>
        <td>${h.party_id}</td>
        <td>${h.voucher_no || "-"}</td>
        <td>₹ ${h.amount}</td>
        <td>${new Date(h.created_at).toLocaleString()}</td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("mainContent").innerHTML = html;
}

async function loadEntryUsage(entry_id, voucher_no) {

   // Avoid duplicate breadcrumb
  if (!breadcrumbStack.find(b => b.label === voucher_no)) {
    breadcrumbStack.push({
      label: voucher_no,
      action: () => loadEntryUsage(entry_id, voucher_no)
        });
  }

  updateBreadcrumb();

  // breadcrumbStack.push({
  //   label: voucher_no,
  //   action: () => loadEntryUsage(entry_id, voucher_no)
  // });
  // updateBreadcrumb();

  const res = await api(`/banks/entry/${entry_id}/usage`);
  const data = await res.json();

  let html = `
    <h3>Usage - ${voucher_no}</h3>
    <table>
      <tr>
        <th>S.No</th>
        <th>Amount</th>
        <th>Type</th>
        <th>Party</th>
        <th>voucher_no</th>
        <th>Date</th>
      </tr>
  `;

  data.data.forEach((u,i)=>{
    html += `
      <tr>
        <td>${i+1}</td>
        <td>₹ ${u.amount}</td>
        <td>${u.type}</td>
        <td>${u.name || "-"}</td>
        <td>${u.voucher_no || "_"}</td>
        <td>${new Date(u.created_at).toLocaleString()}</td>
      </tr>
    `;
  });

  html += "</table>";

  mainContent.innerHTML = html;
}

async function loadBanksForTransfer(){

  const res = await api("/banks");
  const data = await res.json();

  const select = document.getElementById("transferBank");

  select.innerHTML = `<option value="">Select Bank</option>`;

  data.data.forEach(bank=>{
    select.innerHTML += `
      <option value="${bank.id}">
        ${bank.bank_name} (₹ ${Number(bank.balance).toFixed(2)})
      </option>
    `;
  });
}


async function loadTransferEntries(){

  const bankId = document.getElementById("transferBank").value;

  if(!bankId) return;

  const res = await api(`/banks/${bankId}/history`);
  const data = await res.json();

  const entrySelect = document.getElementById("transferEntry");
  entrySelect.innerHTML = "";

  data.data
    .filter(e => Number(e.remaining_amount) > 0)
    .forEach(e=>{
      entrySelect.innerHTML += `
        <option value="${e.id}">
          ${e.voucher_no} - ₹ ${Number(e.remaining_amount).toFixed(2)}
        </option>
      `;
    });
}


async function transferToCash(){

  const bank_id = document.getElementById("transferBank").value;
  const entry_id = document.getElementById("transferEntry").value;
  const amount = Number(document.getElementById("transferAmount").value);

  if(!bank_id || !entry_id || !amount){
    alert("Select bank, entry & amount");
    return;
  }

  const res = await api("/banks/transfer", {
    method:"POST",
    body: JSON.stringify({
      bank_id: Number(bank_id),
      entry_id: Number(entry_id),
      amount: Number(amount)
    })
  });

  const data = await res.json();

  if(!res.ok){
    alert(data.message);
    return;
  }

  alert("Transferred! Cash ID: " + data.cash_id);

  closeModal("transferModal");
  showCash();
}


async function loadBankBalances() {

  const res = await api("/banks");
  const data = await res.json();

  const container = document.getElementById("bankBalancesList");
  container.innerHTML = "";

  if (!data.data.length) {
    container.innerHTML = "No banks available";
    return;
  }

  data.data.forEach(bank => {
    container.innerHTML += `
      <div class="bank-item">
        <strong>${bank.bank_name}</strong><br>
        Balance: ₹ ${Number(bank.balance || 0).toFixed(2)}
      </div>
    `;
  });
}

async function loadCashBalance() {

  const res = await api("/cash");
  const data = await res.json();

  let total = 0;

  data.data.forEach(c => {
    total += Number(c.remaining_amount || 0);
  });

  document.getElementById("totalCashBalance").innerText =
    "₹ " + total.toFixed(2);
}
document.addEventListener("DOMContentLoaded",() =>{
  loadBankBalances();
  loadCashBalance();
});

async function addBank() {

  const bank_name = document.getElementById("bank_name").value.trim();
  const account_no = document.getElementById("account_no").value.trim();
  const ifsc_code = document.getElementById("ifsc_code").value.trim();

  if (!bank_name || !account_no || !ifsc_code) {
    alert("Fill all fields");
    return;
  }

  try {

    const res = await api("/banks", {
      method: "POST",
      body: JSON.stringify({
        bank_name,
        account_no,
        ifsc_code
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to add bank");
      return;
    }

    alert("Bank added successfully");

    closeModal("bankModal");

    showBanks();
    loadBankBalances();

  } catch (err) {
    console.error("Add bank error:", err);
    alert("Something went wrong");
  }
};