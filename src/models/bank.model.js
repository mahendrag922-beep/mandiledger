const pool = require("../config/db");

exports.createBank = async (data) => {
  const [result] = await pool.query(
    "INSERT INTO banks (bank_name, account_no, ifsc_code) VALUES (?, ?, ?)",
    [data.bank_name, data.account_no, data.ifsc_code]
  );
  return result.insertId;
};

exports.getBanks = async () => {
  const [rows] = await pool.query("SELECT * FROM banks");
  return rows;
};

exports.deleteBank = async (id) => {
  await pool.query("DELETE FROM banks WHERE id=?", [id]);
};


/* GET BANK HISTORY (CREDIT ENTRIES) */
exports.getBankHistory = async (bank_id) => {

  const [rows] = await pool.query(
    `SELECT * FROM bank_entries
     WHERE bank_id = ?
     ORDER BY id DESC`,
    [bank_id]
  );

  return rows;
};

/* GET ENTRY USAGE HISTORY */
exports.getBankEntryUsage = async (entry_id) => {

  const [rows] = await pool.query(
    `SELECT bt.*, p.name
     FROM bank_transactions bt
     LEFT JOIN parties p 
       ON bt.party_id = p.id
     WHERE bt.bank_entry_id = ?
     ORDER BY bt.id DESC`,
    [entry_id]
  );
  return rows;
};

exports.transferBankToCash = async ({ bank_id, entry_id, amount, conn }) => {

  /* 1️⃣ Check bank entry */
  const [[entry]] = await conn.query(
    `SELECT * FROM bank_entries
     WHERE id = ? AND bank_id = ?`,
    [entry_id, bank_id]
  );

  if (!entry)
    throw new Error("Invalid bank entry");

  if (Number(entry.remaining_amount) < Number(amount))
    throw new Error("Insufficient entry balance");

  /* 2️⃣ Reduce entry remaining */
  await conn.query(
    `UPDATE bank_entries
     SET remaining_amount = remaining_amount - ?
     WHERE id = ?`,
    [amount, entry_id]
  );

  /* 3️⃣ Reduce bank balance */
  await conn.query(
    `UPDATE banks
     SET balance = balance - ?
     WHERE id = ?`,
    [amount, bank_id]
  );

  /* 4️⃣ Generate Cash ID */
  const [[last]] = await conn.query(
    `SELECT cash_id FROM cash_entries
     ORDER BY id DESC LIMIT 1`
  );

  let cashId = "CASH-0001";

  if (last) {
    const num = parseInt(last.cash_id.split("-")[1]) + 1;
    cashId = `CASH-${String(num).padStart(4, "0")}`;
  }

  /* 5️⃣ Create Cash Entry */
  await conn.query(
    `INSERT INTO cash_entries
     (cash_id, total_amount, remaining_amount)
     VALUES (?, ?, ?)`,
    [cashId, amount, amount]
  );

  /* 6️⃣ Track transfer */
  await conn.query(
    `INSERT INTO bank_transactions
     (bank_entry_id, amount, type)
     VALUES (?, ?, ?)`,
    [entry_id, amount, "transfer-to-cash"]
  );

  return cashId;   // 🔥 IMPORTANT
};