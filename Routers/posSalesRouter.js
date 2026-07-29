const express = require("express");

const router = express.Router();

const {
  createPOSSale,
  getAllPOSSales,
  getPOSSaleById,
  searchPOSSales,
  getTodaySales,
  getRecentSales,
  cancelPOSSale,
} = require("../controller/posSalesController");

router.post("/create", createPOSSale);

router.get("/all", getAllPOSSales);

router.get("/today", getTodaySales);

router.get("/recent", getRecentSales);

router.get("/search", searchPOSSales);

router.get("/:id", getPOSSaleById);

router.put("/cancel/:id", cancelPOSSale);

module.exports = router;
