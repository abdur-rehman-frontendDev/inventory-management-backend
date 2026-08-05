module.exports.getDateFilter = (query) => {
  const { period, from, to } = query;

  const now = new Date();

  let startDate = null;
  let endDate = null;

  //------------------------------------------------
  // TODAY
  //------------------------------------------------

  if (period === "today") {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
  }

  //------------------------------------------------
  // YESTERDAY
  //------------------------------------------------
  else if (period === "yesterday") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
  }

  //------------------------------------------------
  // THIS WEEK
  //------------------------------------------------
  else if (period === "week") {
    startDate = new Date(now);

    const day = startDate.getDay();

    // Monday Start

    const diff = day === 0 ? 6 : day - 1;

    startDate.setDate(startDate.getDate() - diff);

    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(now);

    endDate.setHours(23, 59, 59, 999);
  }

  //------------------------------------------------
  // THIS MONTH
  //------------------------------------------------
  else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    endDate = new Date();

    endDate.setHours(23, 59, 59, 999);
  }

  //------------------------------------------------
  // CUSTOM DATE RANGE
  //------------------------------------------------
  else if (from && to) {
    startDate = new Date(from);

    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(to);

    endDate.setHours(23, 59, 59, 999);
  }

  //------------------------------------------------
  // DEFAULT (ALL TIME)
  //------------------------------------------------
  else {
    return {};
  }

  return {
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };
};
