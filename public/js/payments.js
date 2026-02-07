async function savePayment() {
  const res = await api("/payments", {
    method: "POST",
    body: JSON.stringify({
      party_id: +party_id.value,
      amount: +amount.value,
      payment_type: payment_type.value,
      direction: direction.value
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Error saving payment");
    return;
  }

  alert("Payment saved");

  // Clear form
  party_id.value = "";
  amount.value = "";

  // 🔥 IMPORTANT: reload alerts after payment
  await loadDueAlerts();
}

/* LOAD DUE ALERTS */
async function loadDueAlerts() {
  const res = await api("/reports/outstanding");
  const data = await res.json();
  const tbody = document.getElementById("dueTable");

  tbody.innerHTML = "";

  if (!data.data || data.data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No dues</td></tr>`;
    return;
  }

  data.data.forEach(row => {
    const amount = Number(row.balance) || 0;

    // Only show real dues
    if (amount <= 0) return;

    const actionText =
      row.party_type === "farmer"
        ? "Pay Farmer"
        : "Collect from Mill";

    const directionValue =
      row.party_type === "farmer"
        ? "paid"
        : "received";

    tbody.innerHTML += `
      <tr class="due-row due-red"
          onclick="fillPaymentForm(${row.party_id}, '${directionValue}', ${amount})">
        <td><b>${row.party_id}</b></td>
        <td>${row.name} (${row.party_type})</td>
        <td class="payable">₹ ${amount.toFixed(2)}</td>
        <td class="payable">${actionText}</td>
      </tr>
    `;
  });
}

loadDueAlerts();
