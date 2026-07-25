const Counter = require("../models/CounterModel");

const getNextSequence = async (counterName) => {
  const counter = await Counter.findOneAndUpdate(
    {
      name: counterName,
    },
    {
      $inc: {
        sequence: 1,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  return counter.sequence;
};

const generateSKU = async () => {
  const number = await getNextSequence("PRODUCT_SKU");

  return `SKU${String(number).padStart(6, "0")}`;
};

const generateBarcode = async () => {
  const number = await getNextSequence("PRODUCT_BARCODE");

  return `100${String(number).padStart(7, "0")}`;
};

module.exports = {
  generateSKU,
  generateBarcode,
};