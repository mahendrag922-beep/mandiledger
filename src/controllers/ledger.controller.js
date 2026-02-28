const pool = require("../config/db");

exports.getLedgerByParty = async (req, res) => {

  const { partyId } = req.params;

  const [rows] = await pool.query(`
    SELECT created_at,
           entry_type,
           debit,
           credit,
           balance,
           voucher_no,
           receiptNo
    FROM ledger_entries
    WHERE party_id = ?
    ORDER BY id ASC
  `, [partyId]);

  res.json({
    status: "success",
    data: rows
  });
};