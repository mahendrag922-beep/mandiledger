function formatQuintal(q) {
  const quintal = Math.floor(q);
  const kg = Math.round((q - quintal) * 100);
  return `${quintal} Qtl ${kg} Kg`;
}


/* OPEN MODAL */
function openStockModal() {
  document.getElementById("stockModal").style.display = "flex";
}

/* CLOSE MODAL */
function closeStockModal() {
  stockModal.style.display = "none";
}

/* SAVE STOCK */
async function saveStock() {
  const payload = {
    commodity: commodityName.value.trim(),
    hsn_no: hsnNo.value.trim()
  };

  if (!payload.commodity) {
    alert("Commodity name required");
    return;
  }

  try {
    const res = await api("/stock", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Something went wrong");
      return;
    }

    alert(data.message || "Commodity added successfully");

    closeStockModal();
    loadStock();
    document.querySelectorAll("#stockModal input").forEach(i => i.value = "");
  } catch (err) {
    alert("Server error");
  }
}

  


/* LOAD STOCK */
async function loadStock() {
  const res = await api("/stock");
  const data = await res.json();

  const tbody = document.getElementById("stockBody");
  tbody.innerHTML = "";

  if (!data.data.length) {
    tbody.innerHTML =
      `<tr><td colspan="4">No commodities found</td></tr>`;
    return;
  }

  data.data.forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td>${s.commodity.toUpperCase()}</td>
        <td>${s.hsn_no || "-"}</td>
        <td>${formatQuintal(Number(s.quantity) || 0)}</td>
        <td>
          <button onclick="deleteStock(${s.id})">🗑 Delete</button>
        </td>
      </tr>
    `;
  });
}

/* DELETE */
async function deleteStock(id) {
  if (!confirm("Delete this commodity?")) return;

  const res = await api(`/stock/${id}`, {
    method: "DELETE"
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message);
    return;
  }

  alert(data.message);
  loadStock();
}

