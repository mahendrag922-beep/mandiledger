/* LOAD PARTIES INTO DROPDOWNS */
async function loadParties() {
  const res = await api("/parties");
  const data = await res.json();

  const farmerSelect = document.getElementById("farmerSelect");
  const millSelect = document.getElementById("millSelect");

  data.data.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `#${p.id} - ${p.name}`;

    if (p.party_type === "farmer" || p.party_type === "both") {
      farmerSelect.appendChild(opt.cloneNode(true));
    }
    if (p.party_type === "mill" || p.party_type === "both") {
      millSelect.appendChild(opt.cloneNode(true));
    }
  });
}

/* LOAD LEDGER */
async function loadLedger(type) {
  const select =
    type === "farmer"
      ? document.getElementById("farmerSelect")
      : document.getElementById("millSelect");

  const partyId = select.value;
  if (!partyId) {
    alert("Please select a party");
    return;
  }

  const res = await api(`/ledger/${partyId}`);
  const data = await res.json();

  const tbody = document.getElementById("ledgerTable");
  tbody.innerHTML = "";

  let totalDebit = 0;
  let totalCredit = 0;

  if (!data.data || data.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No ledger entries</td></tr>`;
    return;
  }

  document.getElementById("ledgerTitle").innerText =
    `Ledger – ${select.options[select.selectedIndex].text}`;

  // 🔥 LABEL SWITCH BASED ON TYPE
  // 🔥 LABEL SWITCH BASED ON PARTY TYPE
// 🔥 CHANGE LABELS BASED ON PARTY TYPE (SUMMARY + TABLE)
if (type === "farmer") {
  // Summary labels
  document.getElementById("labelDebit").innerText = "Total Purchase";
  document.getElementById("labelCredit").innerText = "Amount Paid";
  document.getElementById("labelBalance").innerText = "Remaining Balance";

  // Table headers
  document.getElementById("thDebit").innerText = "Purchase";
  document.getElementById("thCredit").innerText = "Paid";
}

if (type === "mill") {
  // Summary labels
  document.getElementById("labelDebit").innerText = "Total Sale";
  document.getElementById("labelCredit").innerText = "Amount Received";
  document.getElementById("labelBalance").innerText = "Remaining Balance";

  // Table headers
  document.getElementById("thDebit").innerText = "Sale";
  document.getElementById("thCredit").innerText = "Received";
}

  data.data.forEach(l => {
    const debit = Number(l.debit) || 0;
    const credit = Number(l.credit) || 0;

    totalDebit += debit;
    totalCredit += credit;

    tbody.innerHTML += `
  <tr>
    <td>
      ${new Date(l.created_at).toLocaleDateString()}
      ${new Date(l.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })}
    </td>

    <td>${l.voucher_no || "-"}</td>

    <td>${l.entry_type}</td>

    <td>${debit ? "₹ " + debit.toFixed(2) : "-"}</td>

    <td>${credit ? "₹ " + credit.toFixed(2) : "-"}</td>
  </tr>
`;
  });

  let balance;

  if (type === "farmer") {
    // Remaining = Purchase - Paid
    balance = totalDebit - totalCredit;
  } else {
    // Mill balance (receivable)
    balance = totalDebit - totalCredit;
  }

  document.getElementById("sumDebit").innerText = totalDebit.toFixed(2);
  document.getElementById("sumCredit").innerText = totalCredit.toFixed(2);
  document.getElementById("sumBalance").innerText = balance.toFixed(2);
}

loadParties();
