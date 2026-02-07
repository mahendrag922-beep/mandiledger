function formatQuintal(q) {
  const quintal = Math.floor(q);
  const kg = Math.round((q - quintal) * 100);
  return `${quintal} Qtl ${kg} Kg`;
}

function formatQuintal(q) {
  const quintal = Math.floor(q);
  const kg = Math.round((q - quintal) * 100);
  return `${quintal} Qtl ${kg} Kg`;
}

async function loadStock() {
  const res = await api("/reports/stock-commodity");
  const data = await res.json();
  const tbody = document.getElementById("stockTable");

  tbody.innerHTML = "";

  if (!data.data.length) {
    tbody.innerHTML = `<tr><td colspan="2">No stock available</td></tr>`;
    return;
  }

  data.data.forEach(row => {
    tbody.innerHTML += `
      <tr>
        <td>${row.commodity}</td>
        <td>${formatQuintal(Number(row.stock) || 0)}</td>
      </tr>
    `;
  });
}

loadStock();
