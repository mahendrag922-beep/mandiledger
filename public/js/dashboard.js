(async function () {

async function loadDashboardCounts() {
  const res = await api("/reports/dashboard-counts");

  if (!res.ok) {
    console.error("Dashboard count API failed");
    return;
  }

  const data = await res.json();

  document.getElementById("purchaseCount").innerText =
    data.data.purchaseCount || 0;

  document.getElementById("saleCount").innerText =
    data.data.saleCount || 0;
}

/* PROFIT (Trader only) */
  if (localStorage.getItem("role") === "trader") {
  const pRes = await api("/reports/profit");
  const pData = await pRes.json();

  const profitValue = Number(pData.data.profit) || 0;

  const profitEl = document.getElementById("profit");
  const labelEl = document.getElementById("profitLabel");
  const cardEl = document.getElementById("profitCard");

  if (profitValue > 0) {
    labelEl.innerText = "Profit";
    profitEl.innerText = "₹ " + profitValue.toFixed(2);
    cardEl.style.background = "#dcfce7"; // light green
    profitEl.style.color = "#166534";
  }
  else if (profitValue < 0) {
    labelEl.innerText = "Loss";
    profitEl.innerText = "₹ " + Math.abs(profitValue).toFixed(2);
    cardEl.style.background = "#fee2e2"; // light red
    profitEl.style.color = "#991b1b";
  }
  else {
    labelEl.innerText = "No Profit / Loss";
    profitEl.innerText = "₹ 0.00";
    cardEl.style.background = "#f1f5f9"; // neutral
    profitEl.style.color = "#334155";
  }
} else {
  document.getElementById("profitLabel").innerText = "Profit / Loss";
  document.getElementById("profit").innerText = "Restricted";
}

  /* OUTSTANDING */
  function animateValue(el, start, end, duration) {
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const value = start + (end - start) * progress;

    el.innerText = "₹ " + value.toFixed(2);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

async function loadOutstanding() {
  const res = await api("/reports/outstanding");
  const data = await res.json();

  let farmerPayable = 0;
  let millReceivable = 0;

  data.data.forEach(r => {
    const bal = Number(r.balance) || 0;
    if (bal <= 0) return;

    if (r.party_type === "farmer") {
      farmerPayable += bal;
    }
    if (r.party_type === "mill") {
      millReceivable += bal;
    }
  });

  const payableEl = document.getElementById("payable");
  const receivableEl = document.getElementById("receivable");

  // 🎞 Animate
  animateValue(payableEl, 0, farmerPayable, 800);
  animateValue(receivableEl, 0, millReceivable, 800);

  // 🎨 Color logic
  payableEl.className =
    "amount " + (farmerPayable > 0 ? "red" : "neutral");

  receivableEl.className =
    "amount " + (millReceivable > 0 ? "green" : "neutral");
}

async function loadLatestPurchases() {
  const res = await api("/reports/today-purchases");
  const data = await res.json();

  const tbody = document.getElementById("purchaseTable");
  tbody.innerHTML = "";

  if (!data.data || data.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">No purchases today</td></tr>`;
    return;
  }

  data.data.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${new Date(p.created_at).toLocaleTimeString()}</td>
        <td>${p.party}</td>
        <td>₹ ${Number(p.total_final_amount).toFixed(2)}</td>
      </tr>
    `;
  });
}
async function loadLatestSales() {
  const res = await api("/reports/today-sales");
  const data = await res.json();

  const tbody = document.getElementById("saleTable");
  tbody.innerHTML = "";

  if (!data.data || data.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">No sales today</td></tr>`;
    return;
  }

  data.data.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td>${new Date(s.created_at).toLocaleTimeString()}</td>
        <td>${s.party}</td>
        <td>₹ ${Number(s.total_amount).toFixed(2)}</td>
      </tr>
    `;
  });
}


loadOutstanding();
loadLatestPurchases();
loadLatestSales();
loadDashboardCounts();

})();
