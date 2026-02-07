/* LOAD ONLY FARMERS */
async function loadFarmers() {
  const res = await api("/parties");
  const data = await res.json();
  const select = document.getElementById("party_id");

  data.data
    .filter(p => p.party_type === "farmer" || p.party_type === "both")
    .forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `#${p.id} - ${p.name}`;
      select.appendChild(opt);
    });
}

/* CALCULATION */
function calculate() {
  const quintal = Number(document.getElementById("quintal").value) || 0;
  const kg = Number(document.getElementById("kg").value) || 0;
  const rate = Number(document.getElementById("rate").value) || 0;

  const totalQuintal = quintal + kg / 100;
  const amount = totalQuintal * rate;

  document.getElementById("amount").innerText = amount.toFixed(2);
}

/* SAVE PURCHASE */
async function savePurchase() {
  const party_id = document.getElementById("party_id").value;
  const commodity = document.getElementById("commodity").value;

  const quintal = Number(document.getElementById("quintal").value) || 0;
  const kg = Number(document.getElementById("kg").value) || 0;
  const rate = Number(document.getElementById("rate").value) || 0;

  const quantity = quintal + kg / 100;
  const amount = quantity * rate;

  if (!party_id || !commodity || quantity <= 0 || rate <= 0) {
    alert("Please fill all fields correctly");
    return;
  }

  await api("/purchases", {
    method: "POST",
    body: JSON.stringify({
      party_id,
      commodity,
      quantity,   // stored as quintal
      rate,       // rate per quintal
      amount
    })
  });

  alert("Purchase saved successfully");

  // Reset
  document.getElementById("commodity").value = "";
  document.getElementById("quintal").value = 0;
  document.getElementById("kg").value = 0;
  document.getElementById("rate").value = "";
  document.getElementById("amount").innerText = "0.00";
}



loadFarmers();
