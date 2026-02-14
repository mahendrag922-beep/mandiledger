const pool = require("../config/db");

exports.addLedgerEntry = async ({
  partyId,
  voucherNo,
  referenceType,
  entryType,
  debit = 0,
  credit = 0,
  referenceId,
  conn
}) => {

  await conn.query(
    `INSERT INTO ledger_entries
     (party_id, voucher_no, reference_type, entry_type, debit, credit, reference_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [partyId, voucherNo, referenceType, entryType, debit, credit, referenceId]
  );

  // Recalculate balance
  const [[result]] = await conn.query(
    `SELECT IFNULL(SUM(credit - debit),0) AS balance
     FROM ledger_entries
     WHERE party_id = ?`,
    [partyId]
  );

  await conn.query(
    `UPDATE ledger_entries
     SET balance = ?
     WHERE party_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [result.balance, partyId]
  );
};

exports.updateLedgerByVoucher = async ({
  partyId,
  voucherNo,
  entryType,
  referenceType,
  debit = 0,
  credit = 0,
  conn
}) => {

  await conn.query(
    `UPDATE ledger_entries
     SET debit = ?,
         credit = ?,
         entry_type = ?,
         modified_at = NOW()
     WHERE party_id = ?
       AND voucher_no = ?
       AND reference_type = ? 
     LIMIT 1`,
    [debit, credit, entryType, partyId, voucherNo,referenceType]
  );

  // Recalculate balance again
  const [[result]] = await conn.query(
    `SELECT IFNULL(SUM(credit - debit),0) AS balance
     FROM ledger_entries
     WHERE party_id = ?`,
    [partyId]
  );

  await conn.query(
    `UPDATE ledger_entries
     SET balance = ?
     WHERE party_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [result.balance, partyId]
  );
};
