const XLSX = require("xlsx");

const Product = require("../models/Productmodel");
const Category = require("../models/Categorymodel");
const {
  generateSKU,
  generateBarcode,
} = require("../libs/productCodeGenerator");

const requiredColumns = require("../helpers/excelColumns");

const {
  normalizeString,
  isPositiveNumber,
} = require("../helpers/productUploadHelper");

const logActivity = require("../libs/logger");

module.exports.UploadProducts = async (req, res) => {
  try {
    const userId = req.user._id;
    const ipAddress = req.ip;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file.",
      });
    }

    // ==========================
    // Read Excel File
    // ==========================

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
    });

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const excelData = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    if (!excelData.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty.",
      });
    }

    // ==========================
    // Validate Columns
    // ==========================

    const excelColumns = Object.keys(excelData[0]);

    const missingColumns = requiredColumns.filter(
      (column) => !excelColumns.includes(column),
    );

    if (missingColumns.length) {
      return res.status(400).json({
        success: false,
        message: "Required columns are missing.",
        missingColumns,
      });
    }

    // ==========================
    // Load Categories (ONE QUERY)
    // ==========================

    const categories = await Category.find({}, "_id name");

    const categoryMap = {};

    categories.forEach((category) => {
      categoryMap[normalizeString(category.name)] = category;
    });

    // ==========================
    // Load Products (ONE QUERY)
    // ==========================

    const products = await Product.find({}, "_id name");

    const productMap = {};

    products.forEach((product) => {
      productMap[normalizeString(product.name)] = product;
    });

    // ==========================
    // Prepare Arrays
    // ==========================

    const insertProducts = [];

    const updateProducts = [];

    const skippedProducts = [];

    const excelProductNames = new Set();

    // ==========================
    // Loop Through Excel
    // ==========================

    for (const [index, row] of excelData.entries()) {
      const rowNumber = index + 2;

      const productName = normalizeString(row.name);

      const description = row.Description?.trim() || "";

      const categoryName = normalizeString(row.Category);

      const purchasePrice = Number(row.purchasePrice);

      const sellingPrice = Number(row.sellingPrice);

      const quantity = Number(row.quantity);

      if (
        !productName ||
        !categoryName ||
        !isPositiveNumber(purchasePrice) ||
        !isPositiveNumber(sellingPrice) ||
        !isPositiveNumber(quantity)
      ) {
        skippedProducts.push({
          row: rowNumber,
          product: row.name || "",
          reason: "Invalid data",
        });

        continue;
      }

      if (excelProductNames.has(productName)) {
        skippedProducts.push({
          row: rowNumber,
          product: row.name,
          reason: "Duplicate product in Excel",
        });

        continue;
      }

      excelProductNames.add(productName);

      const category = categoryMap[categoryName];

      if (!category) {
        skippedProducts.push({
          row: rowNumber,
          product: row.name,
          reason: `Category '${row.Category}' not found`,
        });

        continue;
      }

      const existingProduct = productMap[productName];

      if (existingProduct) {
        updateProducts.push({
          updateOne: {
            filter: { _id: existingProduct._id },
            update: {
              $set: {
                sku: row.sku?.trim() || existingProduct.sku,
                barcode: row.barcode?.trim() || existingProduct.barcode,
                Category: category._id,
                brand: row.brand?.trim() || "",
                unit: row.unit?.trim() || "Piece",
                purchasePrice,
                sellingPrice,
                Price: sellingPrice,
                quantity,
                reorderLevel: Number(row.reorderLevel) || 5,
                status: row.status || "Active",
                updatedBy: userId,
                Description: description,
              },
            },
          },
        });

        continue;
      }

      insertProducts.push({
        name: row.name.trim(),

        sku: row.sku?.trim() || (await generateSKU()),

        barcode: row.barcode?.trim() || (await generateBarcode()),

        Category: category._id,

        brand: row.brand?.trim() || "",

        unit: row.unit?.trim() || "Piece",

        purchasePrice,

        sellingPrice,

        Price: sellingPrice,

        quantity,

        reorderLevel: Number(row.reorderLevel) || 5,

        status: row.status || "Active",

        createdBy: userId,

        updatedBy: userId,

        Description: description,
      });
    }

    // ==========================
    // INSERT PRODUCTS
    // ==========================

    let insertedCount = 0;

    if (insertProducts.length > 0) {
      const insertedProducts = await Product.insertMany(insertProducts);

      insertedCount = insertedProducts.length;
    }

    // ==========================
    // UPDATE PRODUCTS
    // ==========================

    let updatedCount = 0;

    if (updateProducts.length > 0) {
      const updateResult = await Product.bulkWrite(updateProducts);

      updatedCount = updateResult.modifiedCount || updateResult.nModified || 0;
    }

    // ==========================
    // ACTIVITY LOG
    // ==========================

    await logActivity({
      action: "Bulk Upload Products",

      description: `${insertedCount} product(s) inserted, ${updatedCount} product(s) updated.`,

      entity: "product",

      entityId: null,

      userId,

      ipAddress,
    });

    // ==========================
    // FINAL RESPONSE
    // ==========================

    return res.status(200).json({
      success: true,

      message: "Products uploaded successfully.",

      summary: {
        totalRows: excelData.length,

        inserted: insertedCount,

        updated: updatedCount,

        skipped: skippedProducts.length,
      },

      skippedProducts,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
