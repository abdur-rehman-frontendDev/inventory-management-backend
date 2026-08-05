const express = require("express");

const router = express.Router();

const { authmiddleware } = require("../middleware/Authmiddleware");

const {
  getSummaryReport,
  getProductReport,
  getCustomerReport,
  getProfitReport,
  // exportExcelReport,
  // exportPDFReport,
} = require("../controller/reportsController");

router.get("/summary", authmiddleware, getSummaryReport);

router.get("/products", authmiddleware, getProductReport);

router.get("/customers", authmiddleware, getCustomerReport);

router.get("/profit", authmiddleware, getProfitReport);

// router.get("/export/excel", authmiddleware, exportExcelReport);

// router.get("/export/pdf", authmiddleware, exportPDFReport);

module.exports = router;
