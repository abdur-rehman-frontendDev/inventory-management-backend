const POSSale = require("../models/POSSaleModel");
const Product = require("../models/Productmodel");

module.exports.getDashboardSummary = async (req, res) => {
  try {
    //-----------------------------------------
    // Today Date
    //-----------------------------------------

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    //-----------------------------------------
    // Today's Completed Sales
    //-----------------------------------------

    const todaySales = await POSSale.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
      status: "Completed",
    });

    //-----------------------------------------
    // Today's Revenue
    //-----------------------------------------

    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + sale.grandTotal,
      0,
    );

    //-----------------------------------------
    // Today's Profit
    //-----------------------------------------

    const todayProfit = todaySales.reduce(
      (sum, sale) => sum + sale.totalProfit,
      0,
    );

    //-----------------------------------------
    // Total Invoices
    //-----------------------------------------

    const totalInvoices = await POSSale.countDocuments({
      status: "Completed",
    });

    //-----------------------------------------
    // Recent Sales (Last 5)
    //-----------------------------------------

    const recentSales = await POSSale.find({
      status: "Completed",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "_id invoiceNumber customerName grandTotal paymentStatus createdAt",
      );

    //-----------------------------------------
    // Low Stock Products
    //-----------------------------------------

    const lowStockProducts = await Product.find({
      $expr: {
        $lte: ["$quantity", "$reorderLevel"],
      },
    })
      .select("name sku quantity reorderLevel sellingPrice")
      .sort({
        quantity: 1,
      })
      .limit(5);

    //-----------------------------------------
    // Best Selling Products
    //-----------------------------------------

    const bestSellingProducts = await POSSale.aggregate([
      {
        $match: {
          status: "Completed",
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.product",

          name: {
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
        },
      },

      {
        $sort: {
          totalSold: -1,
        },
      },

      {
        $limit: 5,
      },
    ]);

    //-----------------------------------------
    // Response
    //-----------------------------------------

    return res.json({
      success: true,

      dashboard: {
        cards: {
          todayOrders: todaySales.length,

          todayRevenue,

          todayProfit,

          totalInvoices,
        },

        recentSales,

        lowStockProducts,

        bestSellingProducts,
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

module.exports.getRecentDashboardSales = async (req, res) => {
  try {
    const sales = await POSSale.find({
      status: "Completed",
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      sales,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: {
        $lte: ["$quantity", "$reorderLevel"],
      },
    })
      .sort({ quantity: 1 })
      .limit(10);

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getBestSellingProducts = async (req, res) => {
  try {
    const products = await POSSale.aggregate([
      {
        $match: {
          status: "Completed",
        },
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.product",

          name: {
            $first: "$items.name",
          },

          totalSold: {
            $sum: "$items.quantity",
          },

          revenue: {
            $sum: "$items.lineTotal",
          },
        },
      },

      {
        $sort: {
          totalSold: -1,
        },
      },

      {
        $limit: 10,
      },
    ]);

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
