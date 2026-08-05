const POSSale = require("../models/POSSaleModel");

const { getDateFilter } = require("../helpers/reportDateFilter");

module.exports.getSummaryReport = async (req, res) => {
  try {
    //-------------------------------------
    // Date Filter
    //-------------------------------------

    const dateFilter = getDateFilter(req.query);

    //-------------------------------------
    // Completed Sales
    //-------------------------------------

    const matchQuery = {
      ...dateFilter,
      status: "Completed",
    };

    //-------------------------------------
    // Aggregate
    //-------------------------------------

    const summary = await POSSale.aggregate([
      {
        $match: matchQuery,
      },

      {
        $group: {
          _id: null,

          totalInvoices: {
            $sum: 1,
          },

          totalRevenue: {
            $sum: "$grandTotal",
          },

          totalProfit: {
            $sum: "$totalProfit",
          },

          totalPaid: {
            $sum: "$paidAmount",
          },

          totalDue: {
            $sum: "$dueAmount",
          },

          totalDiscount: {
            $sum: "$discount",
          },

          totalTax: {
            $sum: "$tax",
          },
        },
      },
    ]);

    //-------------------------------------
    // Payment Status
    //-------------------------------------

    const paymentStats = await POSSale.aggregate([
      {
        $match: matchQuery,
      },

      {
        $group: {
          _id: "$paymentStatus",

          total: {
            $sum: 1,
          },
        },
      },
    ]);

    //-------------------------------------
    // Cancelled Invoices
    //-------------------------------------

    const cancelledInvoices = await POSSale.countDocuments({
      ...dateFilter,
      status: "Cancelled",
    });

    //-------------------------------------
    // Default Values
    //-------------------------------------

    const result = summary[0] || {
      totalInvoices: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalPaid: 0,
      totalDue: 0,
      totalDiscount: 0,
      totalTax: 0,
    };

    //-------------------------------------
    // Response
    //-------------------------------------

    return res.status(200).json({
      success: true,

      summary: {
        ...result,

        cancelledInvoices,

        paymentStatus: paymentStats,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getProductReport = async (req, res) => {
  try {
    //----------------------------------------
    // Date Filter
    //----------------------------------------

    const dateFilter = getDateFilter(req.query);

    //----------------------------------------
    // Aggregation
    //----------------------------------------

    const report = await POSSale.aggregate([
      {
        $match: {
          ...dateFilter,
          status: "Completed",
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.product",

          productName: {
            $first: "$items.name",
          },

          sku: {
            $first: "$items.sku",
          },

          totalSold: {
            $sum: "$items.quantity",
          },

          revenue: {
            $sum: "$items.lineTotal",
          },

          totalCost: {
            $sum: {
              $multiply: ["$items.purchasePrice", "$items.quantity"],
            },
          },
        },
      },

      {
        $addFields: {
          profit: {
            $subtract: ["$revenue", "$totalCost"],
          },

          averagePrice: {
            $cond: [
              {
                $eq: ["$totalSold", 0],
              },
              0,
              {
                $divide: ["$revenue", "$totalSold"],
              },
            ],
          },
        },
      },

      {
        $sort: {
          totalSold: -1,
        },
      },
    ]);

    //----------------------------------------

    res.json({
      success: true,

      totalProducts: report.length,

      report,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getCustomerReport = async (req, res) => {
  try {
    //----------------------------------------
    // Date Filter
    //----------------------------------------

    const dateFilter = getDateFilter(req.query);

    //----------------------------------------
    // Aggregate
    //----------------------------------------

    const report = await POSSale.aggregate([
      {
        $match: {
          ...dateFilter,
          status: "Completed",
        },
      },

      {
        $group: {
          _id: {
            customerName: "$customerName",
            customerPhone: "$customerPhone",
          },

          customerName: {
            $first: "$customerName",
          },

          customerPhone: {
            $first: "$customerPhone",
          },

          invoices: {
            $sum: 1,
          },

          totalPurchase: {
            $sum: "$grandTotal",
          },

          totalPaid: {
            $sum: "$paidAmount",
          },

          totalDue: {
            $sum: "$dueAmount",
          },

          totalProfit: {
            $sum: "$totalProfit",
          },

          lastPurchase: {
            $max: "$createdAt",
          },
        },
      },

      {
        $sort: {
          totalPurchase: -1,
        },
      },
    ]);

    //----------------------------------------

    res.json({
      success: true,

      totalCustomers: report.length,

      report,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getProfitReport = async (req, res) => {
  try {
    //----------------------------------------
    // Date Filter
    //----------------------------------------

    const dateFilter = getDateFilter(req.query);

    //----------------------------------------
    // Get Sales
    //----------------------------------------

    const sales = await POSSale.find({
      ...dateFilter,
      status: "Completed",
    });

    //----------------------------------------
    // Revenue
    //----------------------------------------

    const grossRevenue = sales.reduce((sum, sale) => sum + sale.subtotal, 0);

    //----------------------------------------
    // Discount
    //----------------------------------------

    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);

    //----------------------------------------
    // Tax
    //----------------------------------------

    const totalTax = sales.reduce((sum, sale) => sum + sale.tax, 0);

    //----------------------------------------
    // Final Revenue
    //----------------------------------------

    const netRevenue = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);

    //----------------------------------------
    // Cost
    //----------------------------------------

    let totalCost = 0;

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        totalCost += item.purchasePrice * item.quantity;
      });
    });

    //----------------------------------------
    // Gross Profit
    //----------------------------------------

    const grossProfit = netRevenue - totalCost;

    //----------------------------------------
    // Profit %
    //----------------------------------------

    const profitPercentage =
      netRevenue === 0
        ? 0
        : Number(((grossProfit / netRevenue) * 100).toFixed(2));

    //----------------------------------------
    // Response
    //----------------------------------------

    res.json({
      success: true,

      report: {
        totalInvoices: sales.length,

        grossRevenue,

        totalDiscount,

        totalTax,

        netRevenue,

        totalCost,

        grossProfit,

        profitPercentage,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
