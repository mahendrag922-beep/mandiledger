async function showExpenseDashboard(){

document.getElementById("contentArea").innerHTML=`

<h2>Expense Dashboard</h2>

<div class="employee-actions">

<div class="employee-card"
onclick="showDirect()">

<div class="icon">💰</div>
<div class="title">
Direct Expense
<br>
<span id="directTotal">₹ 0</span>
</div>

</div>

<div class="employee-card"
onclick="showIndirect()">

<div class="icon">📊</div>
<div class="title">
Indirect Expense
<br>
<span id="indirectTotal">₹ 0</span>
</div>

</div>

<div class="employee-card"
onclick="showMandiCommission()">

<div class="icon">🧾</div>
<div class="title">
Mandi Commission
<br>
<span id="commissionTotal">₹ 0</span>
</div>

</div>

</div>

`;

const res = await api("/expense/dashboard");
const data = await res.json();

document.getElementById("directTotal").innerText =
"₹ " + Number(data.direct || 0).toFixed(2);

document.getElementById("indirectTotal").innerText =
"₹ " + Number(data.indirect || 0).toFixed(2);

document.getElementById("commissionTotal").innerText =
"₹ " + Number(data.commission || 0).toFixed(2);
};
async function showDirect(){

document.getElementById("contentArea").innerHTML=`
<h3>Direct Expense</h3>
<div id="directButtons"></div>
<div id="directHistory"></div>
`;

const res = await api("/expense/direct-summary");
const data = await res.json();

let html=`<div class="employee-actions">`;

data.forEach(row => {

let icon = "💰";

if(row.name === "Transport Charge") icon = "🚚";
if(row.name === "Mill Adjustment") icon = "🏭";
if(row.name === "Unloading Charge") icon = "📦";

html += `
<div class="employee-card"
onclick="loadDirectCategory('${row.name}')">

<div class="icon">${icon}</div>

<div class="title">
${row.name}
<br>
₹ ${Number(row.total).toFixed(2)}
</div>

</div>
`;

});

html+=`</div>`;

document.getElementById("directButtons").innerHTML=html;

};

async function loadDirectCategory(category){

const res = await api(
`/expense/direct-category/${category}`
);

const data = await res.json();

let html=`

<h3>${category} History</h3>

<table class="employee-table">

<tr>
<th>S.No</th>
<th>Expense ID</th>
<th>Date</th>
<th>Voucher</th>
<th>Gaddi</th>
<th>Amount</th>
<th>Payment</th>
<th>Cash</th>
<th>Bank</th>
<th>Entry</th>
</tr>
`;

data.forEach((row,i)=>{

html+=`

<tr>

<td>${i+1}</td>
<td>${row.expense_id}</td>
<td>${row.expense_date}</td>
<td>

${category === "Mill Adjustment"
? `<button onclick="openMillAdjustment('${row.voucher_no}')">
${row.voucher_no}
</button>`
: (row.voucher_no || "-")}

</td>
<td>${row.gaddi_no || "-"}</td>
<td>₹ ${Number(row.amount).toFixed(2)}</td>
<td>${row.payment_type}</td>
<td>${row.cash_id || "-"}</td>
<td>${row.bank_name || "-"}</td>
<td>${row.bank_entry_id || "-"}</td>

</tr>

`;

});

html+="</table>";

document.getElementById("directHistory").innerHTML=html;

};


async function openMillAdjustment(voucherNo) {

  const modal = document.getElementById("millAdjustModal");
  const body = document.getElementById("millAdjustBody");

  const res = await api(`/expense/mill-adjustment/${voucherNo}`);
  const data = await res.json();

  const total =
    Number(data.case_discount || 0) +
    Number(data.weight_shortage || 0) +
    Number(data.unloading_charges || 0) +
    Number(data.brokerage_commission || 0) +
    Number(data.quality_claim || 0) +
    Number(data.bank_charges || 0);

  body.innerHTML = `

<div class="adjust-grid">

<div class="adjust-card">
<span>Case Discount</span>
<b>₹ ${Number(data.case_discount || 0).toFixed(2)}</b>
</div>

<div class="adjust-card">
<span>Weight Shortage</span>
<b>₹ ${Number(data.weight_shortage || 0).toFixed(2)}</b>
</div>

<div class="adjust-card">
<span>Unloading Charges</span>
<b>₹ ${Number(data.unloading_charges || 0).toFixed(2)}</b>
</div>

<div class="adjust-card">
<span>Brokerage Commission</span>
<b>₹ ${Number(data.brokerage_commission || 0).toFixed(2)}</b>
</div>

<div class="adjust-card">
<span>Quality Claim</span>
<b>₹ ${Number(data.quality_claim || 0).toFixed(2)}</b>
</div>


<div class="adjust-card">
<span>Bank Charges</span>
<b>₹ ${Number(data.bank_charges || 0).toFixed(2)}</b>
</div>

<div class="adjust-card" style="background:#ffe9a8">
<span>Total Deduction</span>
<b>₹ ${total.toFixed(2)}</b>
</div>

</div>

`;

  modal.style.display = "block";

};

function closeMillAdjust() {

  document.getElementById("millAdjustModal").style.display = "none";

};

function showIndirect() {
  document.getElementById("contentArea").innerHTML = `
    <h2>Indirect Expense</h2>
    <button onclick="addIndirect()">Add Indirect Expense</button>
    <button onclick="viewIndirect()">Indirect History</button>
  `;
}

function showEmployee() {

  document.getElementById("contentArea").innerHTML = `

    <div class="employee-actions">
      <div class="employee-card active"
           onclick="openEmployeeTab('addEmp', this)">
        <div class="icon">➕</div>
        <div class="title">Add Employee</div>
      </div>

      <div class="employee-card"
           onclick="openEmployeeTab('showEmp', this); loadEmployees();">
        <div class="icon">📋</div>
        <div class="title">Show Employees</div>
      </div>

      <div class="employee-card"
           onclick="openEmployeeTab('addSalary', this)">
        <div class="icon">💰</div>
        <div class="title">Add Salary</div>
      </div>

      <div class="employee-card"
     onclick="openEmployeeTab('salaryHistory', this); viewSalary();">
  <div class="icon">📄</div>
  <div class="title">Salary History</div>
</div>
    </div>

    <div id="addEmp" class="employee-section active">
      <div class="employee-form">
        <label>Name</label>
        <input id="empName">
        <label>Mobile</label>
        <input id="empMobile">
        <label>Role</label>
        <input id="empRole">
        <button class="employee-save-btn"
                onclick="saveEmployee()">
          Save Employee
        </button>
      </div>
    </div>

    <div id="showEmp" class="employee-section">
      <div id="employeeList"></div>
    </div>

    <div id="addSalary" class="employee-section">

  <div class="salary-card">

    <h3>💰 Add Salary</h3>

    <div class="salary-row">
      <div>
        <label>Select Employee</label>
        <select id="salaryEmployeeSelect" onchange="fillEmployeeDetails()">
          <option value="">Select Employee</option>
        </select>
      </div>

      <div>
        <label>Employee ID</label>
        <input id="salaryEmpCode" disabled>
      </div>
    </div>

    <div class="salary-row">
      <div>
        <label>Name</label>
        <input id="salaryEmpName" disabled>
      </div>

      <div>
        <label>Role</label>
        <input id="salaryEmpRole" disabled>
      </div>
    </div>

    <div class="salary-row">
      <div>
        <label>Date</label>
        <input type="date" id="salaryDate">
      </div>

      <div>
        <label>Amount (₹)</label>
        <input type="number" id="salaryAmount">
      </div>
    </div>

    <div class="salary-row">
      <div>
        <label>Payment Type</label>
        <select id="salaryPaymentType" onchange="toggleSalaryPayment()">
          <option value="">Select</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
      </div>
    </div>

    <div id="salaryCashSection" style="display:none;">
      <label>Select Cash ID</label>
      <select id="salaryCashId"></select>
    </div>

    <div id="salaryBankSection" style="display:none;">
      <div class="salary-row">
        <div>
          <label>Select Bank</label>
          <select id="salaryBankId" onchange="loadBankEntries()"></select>
        </div>

        <div>
          <label>Select Bank Entry</label>
          <select id="salaryBankEntryId"></select>
        </div>
      </div>
    </div>

    <button class="employee-save-btn"
            onclick="saveSalaryProfessional()">
      Save Salary
    </button>

  </div>

</div>
    <div id="salaryHistory" class="employee-section">
      <div id="salaryList"></div>
    </div>
  `;
}

function addSalaryForm() {
  document.getElementById("contentArea").innerHTML = `
    <h3>Add Salary</h3>
    <form id="salaryForm">
      <select id="employeeSelect"></select>
      <input type="date" name="salary_date" required>
      <input type="number" name="amount" placeholder="Amount" required>
      <select name="payment_type">
        <option value="cash">Cash</option>
        <option value="bank">Bank</option>
      </select>
      <input type="text" name="bank_name" placeholder="Bank Name">
      <textarea name="remark" placeholder="Remark"></textarea>
      <button type="submit">Save</button>
    </form>
  `;

  loadEmployees();

  document.getElementById("salaryForm")
    .addEventListener("submit", saveSalary);
}

async function loadEmployees() {

  const res = await fetch("/api/employee");
  const data = await res.json();

  const list = document.getElementById("employeeList");

  if (!list) return; // prevents crash

  let html = `
  <table class="employee-table">
    <tr>
      <th>Employee ID</th>
      <th>Name</th>
      <th>Mobile</th>
      <th>Role</th>
    </tr>
`;

  data.forEach(emp => {
    html += `
    <tr>
      <td><b>${emp.employee_code}</b></td>
      <td>${emp.name}</td>
      <td>${emp.mobile || ""}</td>
      <td>${emp.role || ""}</td>
    </tr>
  `;
  });
  html += "</table>";

  list.innerHTML = html;
}


async function saveSalary(e) {
  e.preventDefault();

  const formData = Object.fromEntries(
    new FormData(e.target).entries()
  );

  await fetch("/api/salary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  alert("Salary Added");
}

async function saveEmployee() {

  const data = {
    name: document.getElementById("empName").value,
    mobile: document.getElementById("empMobile").value,
    role: document.getElementById("empRole").value
  };

  await fetch("/api/employee", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  alert("Employee Added Successfully");

  loadEmployees();
}


async function viewSalary() {

  const res = await fetch("/api/salary");
  const data = await res.json();

  let html = `
  <h3>Salary History</h3>

  <table class="employee-table">
  <tr>
    <th>Voucher</th>
    <th>Emp ID</th>
    <th>Name</th>
    <th>Date</th>
    <th>Amount</th>
    <th>Payment</th>
    <th>Cash ID</th>
    <th>Bank</th>
    <th>Bank Entry</th>
    <th>Created By</th>
  </tr>
  `;

  data.forEach(row => {

    html += `
    <tr>
      <td>${row.salary_voucher_no}</td>
      <td>${row.employee_code}</td>
      <td>${row.name}</td>
      <td>${row.salary_date}</td>
      <td>₹ ${row.amount}</td>
      <td>${row.payment_type}</td>
      <td>${row.cash_id || "-"}</td>
      <td>${row.bank_name || "-"}</td>
      <td>${row.bank_entry_id || "-"}</td>
      <td>${row.created_by || "-"}</td>
    </tr>
    `;
  });

  html += "</table>";

  document.getElementById("salaryList").innerHTML = html;
}
function addEmployeeForm() {
  document.getElementById("contentArea").innerHTML = `
    <h3>Add Employee</h3>
    <form id="employeeForm">
      <input type="text" name="name" placeholder="Employee Name" required>
      <input type="text" name="mobile" placeholder="Mobile">
      <input type="text" name="role" placeholder="Role">
      <button type="submit">Save</button>
    </form>
  `;

  document.getElementById("employeeForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(e.target).entries());

      await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      alert("Employee Added");
      showEmployee();
    });
}

async function viewEmployees() {
  const res = await fetch("/api/employee");
  const data = await res.json();

  let html = `
    <h3>Employee List</h3>
    <table border="1" width="100%">
      <tr>
        <th>Name</th>
        <th>Mobile</th>
        <th>Role</th>
        <th>Action</th>
      </tr>
  `;

  data.forEach(emp => {
    html += `
      <tr>
        <td>${emp.name}</td>
        <td>${emp.mobile || ""}</td>
        <td>${emp.role || ""}</td>
        <td>
  <button class="erp-btn blue"
    onclick="editEmployee(${emp.id}, '${emp.name}', '${emp.mobile}', '${emp.role}')">
    Edit
  </button>

  <button class="erp-btn red"
    onclick="deleteEmployee(${emp.id})">
    Delete
  </button>
</td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("contentArea").innerHTML = html;
}

function editEmployee(id, name, mobile, role) {
  document.getElementById("contentArea").innerHTML = `
    <h3>Edit Employee</h3>
    <form id="editForm">
      <input type="text" name="name" value="${name}" required>
      <input type="text" name="mobile" value="${mobile || ''}">
      <input type="text" name="role" value="${role || ''}">
      <button type="submit">Update</button>
    </form>
  `;

  document.getElementById("editForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(e.target).entries());

      await fetch(`/api/employee/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      alert("Employee Updated");
      viewEmployees();
    });
}

async function deleteEmployee(id) {
  if (confirm("Are you sure?")) {
    await fetch(`/api/employee/${id}`, {
      method: "DELETE"
    });

    alert("Employee Deleted");
    viewEmployees();
  }
}

function showFinance() {
  document.getElementById("contentArea").innerHTML = `
    <h2>Upload Bank Passbook PDF</h2>
    <input type="file" id="pdfFile"/>
    <button onclick="uploadPDF()">Upload</button>
  `;
}

async function uploadPDF() {
  const file = document.getElementById("pdfFile").files[0];
  const formData = new FormData();
  formData.append("pdf", file);

  await fetch("/api/finance-upload", {
    method: "POST",
    body: formData
  });

  alert("Bank Charges Imported");
}

/* MAIN SECTION SWITCH */
function openMainSection(sectionId, element) {

  document.querySelectorAll(".purchase-form > .voucher-steps .voucher-card")
    .forEach(card => card.classList.remove("active"));

  element.classList.add("active");

  document.querySelectorAll(".purchase-form > .form-section")
    .forEach(sec => sec.classList.remove("active-section"));

  document.getElementById(sectionId)
    .classList.add("active-section");
}

/* EMPLOYEE SUB SECTION */
function openEmployeeTab(sectionId, element) {

  document.querySelectorAll(".employee-card")
    .forEach(card => card.classList.remove("active"));

  element.classList.add("active");

  document.querySelectorAll(".employee-section")
    .forEach(sec => sec.classList.remove("active"));

  document.getElementById(sectionId)
    .classList.add("active");

  if (sectionId === "addSalary") {
    loadEmployeesForSalary();
  }
}


async function loadEmployeesForSalary() {

  const res = await fetch("/api/employee");
  const data = await res.json();

  const select = document.getElementById("salaryEmployeeSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Select Employee</option>`;

  data.forEach(emp => {
    select.innerHTML += `
      <option value="${emp.id}"
        data-code="${emp.employee_code}"
        data-name="${emp.name}"
        data-role="${emp.role}">
        ${emp.employee_code} - ${emp.name}
      </option>
    `;
  });
}

function fillEmployeeDetails() {

  const select = document.getElementById("salaryEmployeeSelect");
  const option = select.options[select.selectedIndex];

  document.getElementById("salaryEmpCode").value =
    option.getAttribute("data-code") || "";

  document.getElementById("salaryEmpName").value =
    option.getAttribute("data-name") || "";

  document.getElementById("salaryEmpRole").value =
    option.getAttribute("data-role") || "";
}

async function toggleSalaryPayment() {

  const type = document.getElementById("salaryPaymentType").value;

  document.getElementById("salaryCashSection").style.display =
    type === "cash" ? "block" : "none";

  document.getElementById("salaryBankSection").style.display =
    type === "bank" ? "block" : "none";

  if (type === "cash") {
    await loadAvailableCash();
  }

  if (type === "bank") {
    await loadSalaryBanks();
  }
}
async function saveSalaryProfessional() {

  const data = {
    employee_id: salaryEmployeeSelect.value,
    salary_date: salaryDate.value,
    amount: salaryAmount.value,
    payment_type: salaryPaymentType.value,
    cash_id: salaryCashId.value || null,
    bank_id: salaryBankId.value || null,
    bank_entry_id: salaryBankEntryId.value || null
  };

  const res = await api("/salary", {
    method: "POST",
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!res.ok) {
    alert("Error: " + result.message);
    return;
  }

  alert("Salary Added Successfully");
}


async function loadAvailableCash() {

  console.log("Loading cash...");

  try {

    const res = await api("/cash");

    console.log("Response:", res);

    const result = await res.json();

    console.log("Data:", result);

    const select = document.getElementById("salaryCashId");

    console.log("Select element:", select);

    if (!select) {
      console.log("Dropdown not found!");
      return;
    }

    select.innerHTML = `<option value="">Select Cash ID</option>`;

    result.data.forEach(c => {
      select.innerHTML += `
        <option value="${c.cash_id}">
          ${c.cash_id} - ₹ ${Number(c.remaining_amount).toFixed(2)}
        </option>
      `;
    });

  } catch (err) {
    console.error("Cash load error:", err);
  }
}

async function loadSalaryBanks() {

  const res = await api("/banks");
  const data = await res.json();

  const select = document.getElementById("salaryBankId");

  select.innerHTML = `<option value="">Select Bank</option>`;

  data.data.forEach(b => {
    select.innerHTML += `
      <option value="${b.id}">
        ${b.bank_name} (₹ ${Number(b.balance).toFixed(2)})
      </option>
    `;
  });

  // Auto load entries for first bank
  if (data.data.length > 0) {
    select.value = data.data[0].id;
    loadSalaryBankEntries();
  }
}

async function loadSalaryBankEntries() {

  const bankId = document.getElementById("salaryBankId").value;

  if (!bankId) return;

  const res = await api(`/banks/${bankId}/history`);
  const data = await res.json();

  const entrySelect =
    document.getElementById("salaryBankEntryId");

  entrySelect.innerHTML = "";

  const usable =
    data.data.filter(e =>
      Number(e.remaining_amount) > 0
    );

  if (usable.length === 0) {
    entrySelect.innerHTML =
      `<option value="">No usable amount</option>`;
    return;
  }

  usable.forEach(e => {
    entrySelect.innerHTML += `
      <option value="${e.id}">
        ${e.voucher_no} - ₹ ${Number(e.remaining_amount).toFixed(2)}
      </option>
    `;
  });
}

async function addIndirect() {

  document.getElementById("contentArea").innerHTML = `

<h3>Add Indirect Expense</h3>

<div class="salary-card">

<label>Category</label>
<select id="indCategory"></select>

<label>Date</label>
<input type="date" id="indDate">

<label>Amount</label>
<input type="number" id="indAmount">

<label>Payment Type</label>
<select id="indPaymentType" onchange="toggleIndirectPayment()">
<option value="">Select</option>
<option value="cash">Cash</option>
<option value="bank">Bank</option>
</select>

<div id="indCashSection" style="display:none">
<label>Cash ID</label>
<select id="indCashId"></select>
</div>

<div id="indBankSection" style="display:none">
<label>Bank</label>
<select id="indBankId" onchange="loadSalaryBankEntries()"></select>

<label>Bank Entry</label>
<select id="indBankEntryId"></select>
</div>

<label>Remark</label>
<textarea id="indRemark"></textarea>

<button onclick="saveIndirect()">Save Expense</button>

</div>
`;

  loadExpenseCategory();
}

function toggleIndirectPayment() {

  const type =
    document.getElementById("indPaymentType").value;

  document.getElementById("indCashSection").style.display =
    type === "cash" ? "block" : "none";

  document.getElementById("indBankSection").style.display =
    type === "bank" ? "block" : "none";

  if (type === "cash") loadAvailableCash();

  if (type === "bank") loadSalaryBanks();
}

async function viewIndirect() {

  const res = await api("/expense/indirect");

  const data = await res.json();

  let html = `
<h3>Indirect Expense History</h3>

<table class="employee-table">

<tr>
<th>S.No</th>
<th>Expense ID</th>
<th>Category</th>
<th>Date</th>
<th>Amount</th>
<th>Payment</th>
<th>Cash ID</th>
<th>Bank</th>
<th>Bank Entry</th>
<th>Remark</th>
<th>Created By</th>
</tr>
`;

  data.forEach((row, i) => {

    html += `
<tr>

<td>${i + 1}</td>
<td>${row.expense_id}</td>
<td>${row.category}</td>
<td>${row.expense_date}</td>
<td>₹ ${row.amount}</td>
<td>${row.payment_type}</td>
<td>${row.cash_id || "-"}</td>
<td>${row.bank_name || "-"}</td>
<td>${row.bank_entry_id || "-"}</td>
<td>${row.remark || "-"}</td>
<td>${row.created_by || "-"}</td>

</tr>
`;
  });

  html += "</table>";

  document.getElementById("historySection").innerHTML = html;
}

async function loadExpenseCategory() {

  const res = await api("/expense-categories");
  const data = await res.json();

  const select = document.getElementById("indCategory");

  if (!select) return;

  select.innerHTML = `<option value="">Select Category</option>`;

  data.forEach(cat => {

    select.innerHTML += `
      <option value="${cat.id}">
        ${cat.name}
      </option>
    `;

  });

};


function showIndirect() {

  document.getElementById("contentArea").innerHTML = `

<div class="employee-actions">

  <div class="employee-card active"
       onclick="openIndirectTab('addIndirectSection', this); addIndirect();">
    <div class="icon">💸</div>
    <div class="title">Add Expense</div>
  </div>

  <div class="employee-card"
       onclick="openIndirectTab('historySection', this); viewIndirect();">
    <div class="icon">📋</div>
    <div class="title">Expense History</div>
  </div>

  <div class="employee-card"
       onclick="openIndirectTab('totalSection', this); viewIndirectTotal();">
    <div class="icon">📊</div>
    <div class="title">Total Expense</div>
  </div>

</div>


<div id="addIndirectSection" class="employee-section active"></div>

<div id="historySection" class="employee-section"></div>

<div id="totalSection" class="employee-section"></div>

`;

  addIndirect();

}

function showEmployee() {

  document.getElementById("contentArea").innerHTML = `

    <div class="employee-actions">
      <div class="employee-card active"
           onclick="openEmployeeTab('addEmp', this)">
        <div class="icon">➕</div>
        <div class="title">Add Employee</div>
      </div>

      <div class="employee-card"
           onclick="openEmployeeTab('showEmp', this); loadEmployees();">
        <div class="icon">📋</div>
        <div class="title">Show Employees</div>
      </div>

      <div class="employee-card"
           onclick="openEmployeeTab('addSalary', this)">
        <div class="icon">💰</div>
        <div class="title">Add Salary</div>
      </div>

      <div class="employee-card"
     onclick="openEmployeeTab('salaryHistory', this); viewSalary();">
  <div class="icon">📄</div>
  <div class="title">Salary History</div>
</div>
    </div>

    <div id="addEmp" class="employee-section active">
      <div class="employee-form">
        <label>Name</label>
        <input id="empName">
        <label>Mobile</label>
        <input id="empMobile">
        <label>Role</label>
        <input id="empRole">
        <button class="employee-save-btn"
                onclick="saveEmployee()">
          Save Employee
        </button>
      </div>
    </div>

    <div id="showEmp" class="employee-section">
      <div id="employeeList"></div>
    </div>

    <div id="addSalary" class="employee-section">

  <div class="salary-card">

    <h3>💰 Add Salary</h3>

    <div class="salary-row">
      <div>
        <label>Select Employee</label>
        <select id="salaryEmployeeSelect" onchange="fillEmployeeDetails()">
          <option value="">Select Employee</option>
        </select>
      </div>

      <div>
        <label>Employee ID</label>
        <input id="salaryEmpCode" disabled>
      </div>
    </div>

    <div class="salary-row">
      <div>
        <label>Name</label>
        <input id="salaryEmpName" disabled>
      </div>

      <div>
        <label>Role</label>
        <input id="salaryEmpRole" disabled>
      </div>
    </div>

    <div class="salary-row">
      <div>
        <label>Date</label>
        <input type="date" id="salaryDate">
      </div>

      <div>
        <label>Amount (₹)</label>
        <input type="number" id="salaryAmount">
      </div>
    </div>

    <div class="salary-row">
      <div>
        <label>Payment Type</label>
        <select id="salaryPaymentType" onchange="toggleSalaryPayment()">
          <option value="">Select</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
      </div>
    </div>

    <div id="salaryCashSection" style="display:none;">
      <label>Select Cash ID</label>
      <select id="salaryCashId"></select>
    </div>

    <div id="salaryBankSection" style="display:none;">
      <div class="salary-row">
        <div>
          <label>Select Bank</label>
          <select id="salaryBankId" onchange="loadBankEntries()"></select>
        </div>

        <div>
          <label>Select Bank Entry</label>
          <select id="salaryBankEntryId"></select>
        </div>
      </div>
    </div>

    <button class="employee-save-btn"
            onclick="saveSalaryProfessional()">
      Save Salary
    </button>

  </div>

</div>
    <div id="salaryHistory" class="employee-section">
      <div id="salaryList"></div>
    </div>
  `;
}

function addSalaryForm() {
  document.getElementById("contentArea").innerHTML = `
    <h3>Add Salary</h3>
    <form id="salaryForm">
      <select id="employeeSelect"></select>
      <input type="date" name="salary_date" required>
      <input type="number" name="amount" placeholder="Amount" required>
      <select name="payment_type">
        <option value="cash">Cash</option>
        <option value="bank">Bank</option>
      </select>
      <input type="text" name="bank_name" placeholder="Bank Name">
      <textarea name="remark" placeholder="Remark"></textarea>
      <button type="submit">Save</button>
    </form>
  `;

  loadEmployees();

  document.getElementById("salaryForm")
    .addEventListener("submit", saveSalary);
}

async function loadEmployees() {

  const res = await fetch("/api/employee");
  const data = await res.json();

  const list = document.getElementById("employeeList");

  if (!list) return; // prevents crash

  let html = `
  <table class="employee-table">
    <tr>
      <th>Employee ID</th>
      <th>Name</th>
      <th>Mobile</th>
      <th>Role</th>
    </tr>
`;

  data.forEach(emp => {
    html += `
    <tr>
      <td><b>${emp.employee_code}</b></td>
      <td>${emp.name}</td>
      <td>${emp.mobile || ""}</td>
      <td>${emp.role || ""}</td>
    </tr>
  `;
  });
  html += "</table>";

  list.innerHTML = html;
}


async function saveSalary(e) {
  e.preventDefault();

  const formData = Object.fromEntries(
    new FormData(e.target).entries()
  );

  await fetch("/api/salary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  });

  alert("Salary Added");
}

async function saveEmployee() {

  const data = {
    name: document.getElementById("empName").value,
    mobile: document.getElementById("empMobile").value,
    role: document.getElementById("empRole").value
  };

  await fetch("/api/employee", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  alert("Employee Added Successfully");

  loadEmployees();
}


async function viewSalary() {

  const res = await fetch("/api/salary");
  const data = await res.json();

  let html = `
  <h3>Salary History</h3>

  <table class="employee-table">
  <tr>
    <th>Voucher</th>
    <th>Emp ID</th>
    <th>Name</th>
    <th>Date</th>
    <th>Amount</th>
    <th>Payment</th>
    <th>Cash ID</th>
    <th>Bank</th>
    <th>Bank Entry</th>
    <th>Created By</th>
  </tr>
  `;

  data.forEach(row => {

    html += `
    <tr>
      <td>${row.salary_voucher_no}</td>
      <td>${row.employee_code}</td>
      <td>${row.name}</td>
      <td>${row.salary_date}</td>
      <td>₹ ${row.amount}</td>
      <td>${row.payment_type}</td>
      <td>${row.cash_id || "-"}</td>
      <td>${row.bank_name || "-"}</td>
      <td>${row.bank_entry_id || "-"}</td>
      <td>${row.created_by || "-"}</td>
    </tr>
    `;
  });

  html += "</table>";

  document.getElementById("salaryList").innerHTML = html;
}
function addEmployeeForm() {
  document.getElementById("contentArea").innerHTML = `
    <h3>Add Employee</h3>
    <form id="employeeForm">
      <input type="text" name="name" placeholder="Employee Name" required>
      <input type="text" name="mobile" placeholder="Mobile">
      <input type="text" name="role" placeholder="Role">
      <button type="submit">Save</button>
    </form>
  `;

  document.getElementById("employeeForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(e.target).entries());

      await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      alert("Employee Added");
      showEmployee();
    });
}

async function viewEmployees() {
  const res = await fetch("/api/employee");
  const data = await res.json();

  let html = `
    <h3>Employee List</h3>
    <table border="1" width="100%">
      <tr>
        <th>Name</th>
        <th>Mobile</th>
        <th>Role</th>
        <th>Action</th>
      </tr>
  `;

  data.forEach(emp => {
    html += `
      <tr>
        <td>${emp.name}</td>
        <td>${emp.mobile || ""}</td>
        <td>${emp.role || ""}</td>
        <td>
  <button class="erp-btn blue"
    onclick="editEmployee(${emp.id}, '${emp.name}', '${emp.mobile}', '${emp.role}')">
    Edit
  </button>

  <button class="erp-btn red"
    onclick="deleteEmployee(${emp.id})">
    Delete
  </button>
</td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("contentArea").innerHTML = html;
}

function editEmployee(id, name, mobile, role) {
  document.getElementById("contentArea").innerHTML = `
    <h3>Edit Employee</h3>
    <form id="editForm">
      <input type="text" name="name" value="${name}" required>
      <input type="text" name="mobile" value="${mobile || ''}">
      <input type="text" name="role" value="${role || ''}">
      <button type="submit">Update</button>
    </form>
  `;

  document.getElementById("editForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(e.target).entries());

      await fetch(`/api/employee/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      alert("Employee Updated");
      viewEmployees();
    });
}

async function deleteEmployee(id) {
  if (confirm("Are you sure?")) {
    await fetch(`/api/employee/${id}`, {
      method: "DELETE"
    });

    alert("Employee Deleted");
    viewEmployees();
  }
}

function showFinance() {
  document.getElementById("contentArea").innerHTML = `
    <h2>Upload Bank Passbook PDF</h2>
    <input type="file" id="pdfFile"/>
    <button onclick="uploadPDF()">Upload</button>
  `;
}

async function uploadPDF() {
  const file = document.getElementById("pdfFile").files[0];
  const formData = new FormData();
  formData.append("pdf", file);

  await fetch("/api/finance-upload", {
    method: "POST",
    body: formData
  });

  alert("Bank Charges Imported");
}

/* MAIN SECTION SWITCH */
function openMainSection(sectionId, element) {

  document.querySelectorAll(".purchase-form > .voucher-steps .voucher-card")
    .forEach(card => card.classList.remove("active"));

  element.classList.add("active");

  document.querySelectorAll(".purchase-form > .form-section")
    .forEach(sec => sec.classList.remove("active-section"));

  document.getElementById(sectionId)
    .classList.add("active-section");
}

/* EMPLOYEE SUB SECTION */
function openEmployeeTab(sectionId, element) {

  document.querySelectorAll(".employee-card")
    .forEach(card => card.classList.remove("active"));

  element.classList.add("active");

  document.querySelectorAll(".employee-section")
    .forEach(sec => sec.classList.remove("active"));

  document.getElementById(sectionId)
    .classList.add("active");

  if (sectionId === "addSalary") {
    loadEmployeesForSalary();
  }
}


function openIndirectTab(sectionId, element) {

  document.querySelectorAll(".employee-card")
    .forEach(card => card.classList.remove("active"));

  element.classList.add("active");

  document.querySelectorAll(".employee-section")
    .forEach(sec => sec.classList.remove("active"));

  document.getElementById(sectionId)
    .classList.add("active");

};

async function loadEmployeesForSalary() {

  const res = await fetch("/api/employee");
  const data = await res.json();

  const select = document.getElementById("salaryEmployeeSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Select Employee</option>`;

  data.forEach(emp => {
    select.innerHTML += `
      <option value="${emp.id}"
        data-code="${emp.employee_code}"
        data-name="${emp.name}"
        data-role="${emp.role}">
        ${emp.employee_code} - ${emp.name}
      </option>
    `;
  });
}

function fillEmployeeDetails() {

  const select = document.getElementById("salaryEmployeeSelect");
  const option = select.options[select.selectedIndex];

  document.getElementById("salaryEmpCode").value =
    option.getAttribute("data-code") || "";

  document.getElementById("salaryEmpName").value =
    option.getAttribute("data-name") || "";

  document.getElementById("salaryEmpRole").value =
    option.getAttribute("data-role") || "";
}

async function toggleSalaryPayment() {

  const type = document.getElementById("salaryPaymentType").value;

  document.getElementById("salaryCashSection").style.display =
    type === "cash" ? "block" : "none";

  document.getElementById("salaryBankSection").style.display =
    type === "bank" ? "block" : "none";

  if (type === "cash") {
    await loadAvailableCash();
  }

  if (type === "bank") {
    await loadSalaryBanks();
  }
}
async function saveSalaryProfessional() {

  const data = {
    employee_id: salaryEmployeeSelect.value,
    salary_date: salaryDate.value,
    amount: salaryAmount.value,
    payment_type: salaryPaymentType.value,
    cash_id: salaryCashId.value || null,
    bank_id: salaryBankId.value || null,
    bank_entry_id: salaryBankEntryId.value || null
  };

  const res = await api("/salary", {
    method: "POST",
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!res.ok) {
    alert("Error: " + result.message);
    return;
  }

  alert("Salary Added Successfully");
}


async function loadAvailableCash() {

  console.log("Loading cash...");

  try {

    const res = await api("/cash");

    console.log("Response:", res);

    const result = await res.json();

    console.log("Data:", result);

    const select = document.getElementById("salaryCashId");

    console.log("Select element:", select);

    if (!select) {
      console.log("Dropdown not found!");
      return;
    }

    select.innerHTML = `<option value="">Select Cash ID</option>`;

    result.data.forEach(c => {
      select.innerHTML += `
        <option value="${c.cash_id}">
          ${c.cash_id} - ₹ ${Number(c.remaining_amount).toFixed(2)}
        </option>
      `;
    });

  } catch (err) {
    console.error("Cash load error:", err);
  }
}

async function loadSalaryBanks() {

  const res = await api("/banks");
  const data = await res.json();

  const select = document.getElementById("salaryBankId");

  select.innerHTML = `<option value="">Select Bank</option>`;

  data.data.forEach(b => {
    select.innerHTML += `
      <option value="${b.id}">
        ${b.bank_name} (₹ ${Number(b.balance).toFixed(2)})
      </option>
    `;
  });

  // Auto load entries for first bank
  if (data.data.length > 0) {
    select.value = data.data[0].id;
    loadSalaryBankEntries();
  }
}

async function loadSalaryBankEntries() {

  const bankId = document.getElementById("salaryBankId").value;

  if (!bankId) return;

  const res = await api(`/banks/${bankId}/history`);
  const data = await res.json();

  const entrySelect =
    document.getElementById("salaryBankEntryId");

  entrySelect.innerHTML = "";

  const usable =
    data.data.filter(e =>
      Number(e.remaining_amount) > 0
    );

  if (usable.length === 0) {
    entrySelect.innerHTML =
      `<option value="">No usable amount</option>`;
    return;
  }

  usable.forEach(e => {
    entrySelect.innerHTML += `
      <option value="${e.id}">
        ${e.voucher_no} - ₹ ${Number(e.remaining_amount).toFixed(2)}
      </option>
    `;
  });
}

async function addIndirect() {

  document.getElementById("addIndirectSection").innerHTML = `

<h3>Add Indirect Expense</h3>

<div class="salary-card">

<label>Category</label>
<select id="indCategory"></select>

<label>Date</label>
<input type="date" id="indDate">

<label>Amount</label>
<input type="number" id="indAmount">

<label>Payment Type</label>
<select id="indPaymentType" onchange="toggleIndirectPayment()">
<option value="">Select</option>
<option value="cash">Cash</option>
<option value="bank">Bank</option>
</select>

<div id="indCashSection" style="display:none">
<label>Cash ID</label>
<select id="indCashId"></select>
</div>

<div id="indBankSection" style="display:none">
<label>Bank</label>
<select id="indBankId" onchange="loadIndirectBankEntries()"></select>

<label>Bank Entry</label>
<select id="indBankEntryId"></select>
</div>

<label>Remark</label>
<textarea id="indRemark"></textarea>

<button onclick="saveIndirect()">Save Expense</button>

</div>
`;

  loadExpenseCategory();
}

function toggleIndirectPayment() {

  const type =
    document.getElementById("indPaymentType").value;

  document.getElementById("indCashSection").style.display =
    type === "cash" ? "block" : "none";

  document.getElementById("indBankSection").style.display =
    type === "bank" ? "block" : "none";

  if (type === "cash") {

    loadIndirectCash();

  }

  if (type === "bank") {

    loadIndirectBanks();

  }

};

async function viewIndirectTotal() {

  const res = await api("/expense/indirect-total");
  const data = await res.json();

  let html = `
<h3>Total Indirect Expense</h3>

<table class="employee-table">

<tr>
<th>S.No</th>
<th>Category ID</th>
<th>Category Name</th>
<th>Total Expense</th>
</tr>
`;

  let grandTotal = 0;

  data.forEach((row, i) => {

    grandTotal += Number(row.total || 0);

    html += `
<tr>
<td>${i + 1}</td>
<td>${row.category_code}</td>
<td>${row.category_name}</td>
<td>₹ ${Number(row.total).toFixed(2)}</td>
</tr>
`;

  });

  html += `
<tr style="background:#f2f2f2;font-weight:bold">
<td colspan="3">TOTAL</td>
<td>₹ ${grandTotal.toFixed(2)}</td>
</tr>
`;

  html += "</table>";

  document.getElementById("totalSection").innerHTML = html;

};

async function loadExpenseCategory() {

  const res = await api("/expense-categories");
  const data = await res.json();

  const select = document.getElementById("indCategory");

  if (!select) return;

  select.innerHTML = `<option value="">Select Category</option>`;

  data.forEach(cat => {

    select.innerHTML += `
      <option value="${cat.id}">
        ${cat.name}
      </option>
    `;

  });

};

async function loadIndirectBankEntries() {

  const bankId = document.getElementById("indBankId").value;

  if (!bankId) return;

  const res = await api(`/banks/${bankId}/history`);
  const data = await res.json();

  const select = document.getElementById("indBankEntryId");

  select.innerHTML = "";

  const usable = data.data.filter(e =>
    Number(e.remaining_amount) > 0
  );

  if (usable.length === 0) {

    select.innerHTML =
      `<option value="">No usable amount</option>`;

    return;

  }

  usable.forEach(e => {

    select.innerHTML += `
      <option value="${e.id}">
        ${e.voucher_no} - ₹ ${Number(e.remaining_amount).toFixed(2)}
      </option>
    `;

  });

}

async function loadIndirectCash() {

  const res = await api("/cash");
  const result = await res.json();

  const select = document.getElementById("indCashId");

  if (!select) return;

  select.innerHTML = `<option value="">Select Cash ID</option>`;

  result.data.forEach(c => {

    select.innerHTML += `
      <option value="${c.cash_id}">
        ${c.cash_id} - ₹ ${Number(c.remaining_amount).toFixed(2)}
      </option>
    `;

  });

}

async function loadIndirectBanks() {

  const res = await api("/banks");
  const data = await res.json();

  const select = document.getElementById("indBankId");

  if (!select) return;

  select.innerHTML = `<option value="">Select Bank</option>`;

  data.data.forEach(b => {

    select.innerHTML += `
      <option value="${b.id}">
        ${b.bank_name} (₹ ${Number(b.balance).toFixed(2)})
      </option>
    `;

  });

};

async function saveIndirect() {

  const data = {
    category_id: Number(document.getElementById("indCategory").value),
    expense_date: document.getElementById("indDate").value,
    amount: Number(document.getElementById("indAmount").value),
    payment_type: document.getElementById("indPaymentType").value,
    cash_id: document.getElementById("indCashId").value || null,
    bank_id: document.getElementById("indBankId").value || null,
    bank_entry_id: document.getElementById("indBankEntryId").value || null,
    remark: document.getElementById("indRemark").value
  };
  const res = await api("/expense", {
    method: "POST",
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!res.ok) {
    alert("Error: " + result.message);
    return;
  }

  alert("Indirect Expense Saved");

  viewIndirect();
};

async function showMandiCommission() {

  document.getElementById("contentArea").innerHTML = `
<h3>Mandi Commission History</h3>
<div id="commissionList"></div>
`;

  const res = await api("/expense/mandi-commission");
  const data = await res.json();

  //console.log("FRONTEND DATA:", data);

  let html = `
<table class="employee-table">

<tr>
<th>S.No</th>
<th>Commission ID</th>
<th>Voucher No</th>
<th>Gaddi No</th>
<th>Party Name</th>
<th>Percent</th>
<th>Commission Amount</th>
<th>Total Amount</th>
</tr>
`;

  data.forEach((row, i) => {

    html += `
<tr>
<td>${i + 1}</td>
<td>${row.commission_id}</td>
<td>${row.voucher_no}</td>
<td>${row.gaddi_no || "-"}</td>
<td>${row.party_name}</td>
<td>${row.commission_percent}%</td>
<td>₹ ${row.commission_amount}</td>
<td>₹ ${row.total_amount}</td>
</tr>
`;

  });

  html += "</table>";

  document.getElementById("commissionList").innerHTML = html;

};

async function showMillAnalytics() {

  document.getElementById("contentArea").innerHTML = `
<h3>Mill Deduction Analytics</h3>
<div id="millAnalytics"></div>
`;

  const res = await api("/expense/mill-analytics");
  const data = await res.json();

  let html = `

<table class="employee-table">

<tr>
<th>S.No</th>
<th>Mill Name</th>
<th>Total Sales</th>
<th>Total Deduction</th>
<th>Deduction %</th>
</tr>

`;

  data.forEach((row, i) => {

    const percent = Number(row.deduction_percent);

    let color = "green";

    if (percent > 2) color = "red";
    else if (percent > 1) color = "orange";

    html += `

<tr>

<td>${i + 1}</td>

<td>
<a href="#" onclick="showMillBreakdown('${row.mill_name}')">
${row.mill_name}
</a>
</td>

<td>₹ ${Number(row.total_sales).toFixed(2)}</td>

<td>₹ ${Number(row.total_deduction).toFixed(2)}</td>

<td style="color:${color};font-weight:bold">
${percent} %
</td>

</tr>

`;

  });

  html += "</table>";

  document.getElementById("millAnalytics").innerHTML = html;

};

async function showMillBreakdown(mill){

document.getElementById("contentArea").innerHTML = `
<h3>${mill} - Sale Breakdown</h3>
<div id="millBreakdown"></div>
`;

const res = await api(`/expense/mill-breakdown/${mill}`);
const data = await res.json();

let html = `
<table class="employee-table">

<tr>
<th>S.No</th>
<th>Sale Voucher</th>
<th>Total Sale</th>
<th>Total Deduction</th>
<th>Deduction %</th>
</tr>
`;

data.forEach((row,i)=>{

html+=`
<tr>

<td>${i+1}</td>

<td>
<button onclick="openMillAdjustment('${row.sale_voucher_no}')">
${row.sale_voucher_no}
</button>
</td>

<td>₹ ${Number(row.amount).toFixed(2)}</td>

<td>₹ ${Number(row.deduction).toFixed(2)}</td>

<td>${row.percent}%</td>

</tr>
`;

});

html+="</table>";

document.getElementById("millBreakdown").innerHTML = html;

};
showExpenseDashboard();