module.exports = async ({
  model,
  query = {},
  page = 1,
  limit = 10,
  sort = { createdAt: -1 },
  select = "",
  populate = "",
}) => {
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model
      .find(query)
      .sort(sort)
      .select(select)
      .populate(populate)
      .skip(skip)
      .limit(limit),

    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      totalRecords: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      perPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
};
