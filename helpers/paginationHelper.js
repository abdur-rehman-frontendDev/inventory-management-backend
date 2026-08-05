const getPagination = (query = {}) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  //------------------------------------
  // Defaults
  //------------------------------------

  if (isNaN(page) || page < 1) page = 1;

  if (isNaN(limit) || limit < 1) limit = 10;

  //------------------------------------
  // Prevent huge requests
  //------------------------------------

  if (limit > 100) limit = 100;

  //------------------------------------
  // Skip
  //------------------------------------

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Build pagination response
 */

const buildPagination = ({ page, limit, totalRecords }) => {
  const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit);

  return {
    currentPage: page,

    perPage: limit,

    totalRecords,

    totalPages,

    hasNextPage: page < totalPages,

    hasPreviousPage: page > 1,

    nextPage: page < totalPages ? page + 1 : null,

    previousPage: page > 1 ? page - 1 : null,

    from: totalRecords === 0 ? 0 : (page - 1) * limit + 1,

    to: Math.min(page * limit, totalRecords),
  };
};

/**
 * Standard paginated response
 */

const paginatedResponse = ({ data, page, limit, totalRecords }) => {
  return {
    success: true,

    data,

    pagination: buildPagination({
      page,
      limit,
      totalRecords,
    }),
  };
};

module.exports = {
  getPagination,
  buildPagination,
  paginatedResponse,
};
