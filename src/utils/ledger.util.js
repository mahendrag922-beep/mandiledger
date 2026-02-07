const pool = require("../config/db");

exports.addLedgerEntry = async ({
  partyId,
  entryType,
  debit = 0,
  credit = 0,
  referenceId,
  conn
}) => {

  // 1️⃣ Insert ledger row WITHOUT balance
  await conn.query(
    `INSERT INTO ledger_entries
     (party_id, entry_type, debit, credit, reference_id)
     VALUES (?, ?, ?, ?, ?)`,
    [partyId, entryType, debit, credit, referenceId]
  );

  // 2️⃣ Recalculate correct balance
  const [[result]] = await conn.query(
    `
    SELECT 
      IFNULL(SUM(credit - debit), 0) AS balance
    FROM ledger_entries
    WHERE party_id = ?
    `,
    [partyId]
  );

  const balance = result.balance;

  // 3️⃣ Update balance ONLY for latest row
  await conn.query(
    `
    UPDATE ledger_entries
    SET balance = ?
    WHERE party_id = ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [balance, partyId]
  );

  return balance;
};
