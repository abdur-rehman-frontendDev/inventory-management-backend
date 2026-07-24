const normalizeString = (value = "") => {
  return value
    .toString()
    .trim()
    .toLowerCase();
};

const isPositiveNumber = (value) => {
  const number = Number(value);

  return !isNaN(number) && number >= 0;
};

module.exports = {
  normalizeString,
  isPositiveNumber,
};