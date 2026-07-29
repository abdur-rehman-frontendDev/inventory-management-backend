const Counter = require("../models/CounterModel");

async function generateInvoiceNumber() {
  const counter = await Counter.findOneAndUpdate(
    { name: "invoice" },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

  return `INV-${String(counter.sequence).padStart(6, "0")}`;
}

module.exports = generateInvoiceNumber;