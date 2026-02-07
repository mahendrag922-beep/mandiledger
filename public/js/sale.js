/* LOAD ONLY MILLS */
async function loadMills() {
  const res = await api("/parties");
  const data = await res.json();
  const select = document.getElementById("party_id");

  data.data
    .filter(p => p.party_type === "mill" || p.party_type === "both")
    .forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `#${p.id} - ${p.name}`;
      select.appendChild(opt);
    });
}
/* live stock */
async function loadStockForCommodity(commodity) {
  if (!commodity) {
    document.getElementById("availableStock").innerText = "0 Qtl";
    return;
  }

  const res = await api("/stock");
  const data = await res.json();

  const row = data.data.find(s => s.commodity === commodity);
  const qty = Number(row?.quantity || 0);

  document.getElementById("availableStock").innerText =
    `${qty.toFixed(2)} Qtl`;
}


/* CALCULATE AMOUNT */
function calculate() {
  const quintal = Number(document.getElementById("quintal").value) || 0;
  const kg = Number(document.getElementById("kg").value) || 0;
  const rate = Number(document.getElementById("rate").value) || 0;

  const totalQuintal = quintal + kg / 100;
  const amount = totalQuintal * rate;

  document.getElementById("amount").innerText = amount.toFixed(2);
}

/* SAVE SALE */
async function saveSale() {
  const party_id = document.getElementById("party_id").value;
  const commodity = document.getElementById("commodity").value;

  const quintal = Number(document.getElementById("quintal").value) || 0;
  const kg = Number(document.getElementById("kg").value) || 0;
  const rate = Number(document.getElementById("rate").value) || 0;

  const quantity = quintal + kg / 100;

  if (!party_id || !commodity || quantity <= 0 || rate <= 0) {
    alert("Please fill all fields correctly");
    return;
  }

  try {
    const res = await api("/sales", {
      method: "POST",
      body: JSON.stringify({
        party_id,
        commodity,
        quantity,   // quintal
        rate
      })
    });

    const data = await res.json();

    if (!res.ok) {
      // 🔴 THIS WILL SHOW "Insufficient stock"
      alert(data.message);
      return;
    }

    alert("Sale saved successfully");

    // Reset form
    document.getElementById("commodity").value = "";
    document.getElementById("quintal").value = 0;
    document.getElementById("kg").value = 0;
    document.getElementById("rate").value = "";
    document.getElementById("amount").innerText = "0.00";

  } catch (err) {
    alert("Server error. Try again.");
  }
}

loadMills();
