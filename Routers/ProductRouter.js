const express = require("express");
const router = express.Router();
const {
  Addproduct,
  getTopProductsByQuantity,
  RemoveProduct,
  SearchProduct,
  EditProduct,
  getProduct,
} = require("../controller/productController");
const {
  authmiddleware,
  adminmiddleware,
  managermiddleware,
} = require("../middleware/Authmiddleware");
const upload = require("../middleware/upload");
const { UploadProducts } = require("../controller/bulkUploadController");

router.post("/addproduct", authmiddleware, Addproduct);
router.delete("/removeproduct/:productId", authmiddleware, RemoveProduct);
router.get("/getproduct", authmiddleware, getProduct);
router.get("/searchproduct", authmiddleware, SearchProduct);
router.put("/editproduct/:productId", authmiddleware, EditProduct);
router.get(
  "/getTopProductsByQuantity",
  authmiddleware,
  getTopProductsByQuantity,
);
router.post(
  "/uploadproducts",
  authmiddleware,
  upload.single("file"),
  UploadProducts,
);

module.exports = router;
