const express = require("express");

const router = express.Router();

const { authmiddleware } = require("../middleware/Authmiddleware");

const {
  getDashboardSummary,
  getRecentDashboardSales,
  getLowStockProducts,
  getBestSellingProducts,
} = require("../controller/dashboardController");

router.get("/summary", authmiddleware, getDashboardSummary);

router.get("/recent-sales", authmiddleware, getRecentDashboardSales);

router.get("/low-stock", authmiddleware, getLowStockProducts);

router.get("/best-selling", authmiddleware, getBestSellingProducts);

module.exports = router;
