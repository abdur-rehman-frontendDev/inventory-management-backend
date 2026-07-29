const express = require("express");

const router = express.Router();

const {
  createPOSInvoice,
  getAllPOSInvoices,
  getSinglePOSInvoice,
  searchPOSInvoices,
} = require("../controller/posController");

const { authmiddleware } = require("../middleware/Authmiddleware");

// Create Invoice
router.post("/create", authmiddleware, createPOSInvoice);

// Get All Invoices
router.get("/", authmiddleware, getAllPOSInvoices);

// Search Invoice
router.get("/search", authmiddleware, searchPOSInvoices);

// Get Single Invoice
router.get("/:id", authmiddleware, getSinglePOSInvoice);

module.exports = router;
