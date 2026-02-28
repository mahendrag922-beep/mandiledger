const express = require("express");
const path = require("path");

const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../public")));

// API routes (will expand later)
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/parties", require("./routes/party.routes"));
app.use("/api/ledger", require("./routes/ledger.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/stock", require("./routes/stock.routes"));
app.use("/api/brokers", require("./routes/broker.routes"));
app.use("/api/transports", require("./routes/transport.routes"));
app.use("/api/vouchers", require("./routes/voucher.routes"));
app.use("/api/banks", require("./routes/bank.routes"));
app.use("/api/cash", require("./routes/cash.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use(errorHandler);

module.exports = app;
