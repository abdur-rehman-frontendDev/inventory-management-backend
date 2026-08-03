const XLSX = require("xlsx");

const Category = require("../models/Categorymodel");

const logActivity = require("../libs/logger");

const normalize = (value = "") =>
  value.toString().trim().replace(/\s+/g, " ").toLowerCase();

module.exports.UploadCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const ipAddress = req.ip;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file.",
      });
    }

    //-------------------------------------
    // Read Excel
    //-------------------------------------

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const excelData = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    });

    if (!excelData.length) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty.",
      });
    }

    //-------------------------------------
    // Validate Columns
    //-------------------------------------

    const requiredColumns = ["name", "description"];

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

    //-------------------------------------
    // Existing Categories
    //-------------------------------------

    const existingCategories = await Category.find({}, "_id name");

    const categoryMap = {};

    existingCategories.forEach((cat) => {
      categoryMap[normalize(cat.name)] = cat;
    });

    //-------------------------------------
    // Prepare Arrays
    //-------------------------------------

    const insertCategories = [];

    const updateCategories = [];

    const skippedCategories = [];

    const excelNames = new Set();

    //-------------------------------------
    // Loop Excel
    //-------------------------------------

    for (const [index, row] of excelData.entries()) {
      const rowNo = index + 2;

      const name = row.name?.toString().trim();

      const description = row.description?.toString().trim() || "";

      if (!name) {
        skippedCategories.push({
          row: rowNo,
          category: "",
          reason: "Category name missing",
        });

        continue;
      }

      const normalizedName = normalize(name);

      if (excelNames.has(normalizedName)) {
        skippedCategories.push({
          row: rowNo,
          category: name,
          reason: "Duplicate category in Excel",
        });

        continue;
      }

      excelNames.add(normalizedName);

      const existing = categoryMap[normalizedName];

      if (existing) {
        updateCategories.push({
          updateOne: {
            filter: {
              _id: existing._id,
            },
            update: {
              $set: {
                description,
              },
            },
          },
        });

        continue;
      }

      insertCategories.push({
        name,
        description,
      });
    }

    //-------------------------------------
    // Insert
    //-------------------------------------

    let inserted = 0;

    if (insertCategories.length) {
      const docs = await Category.insertMany(insertCategories);

      inserted = docs.length;
    }

    //-------------------------------------
    // Update
    //-------------------------------------

    let updated = 0;

    if (updateCategories.length) {
      const result = await Category.bulkWrite(updateCategories);

      updated = result.modifiedCount || result.nModified || 0;
    }

    //-------------------------------------
    // Activity Log
    //-------------------------------------

    await logActivity({
      action: "Bulk Upload Categories",

      description: `${inserted} inserted, ${updated} updated.`,

      entity: "category",

      entityId: null,

      userId,

      ipAddress,
    });

    //-------------------------------------
    // Response
    //-------------------------------------

    return res.status(200).json({
      success: true,

      message: "Categories uploaded successfully.",

      summary: {
        totalRows: excelData.length,

        inserted,

        updated,

        skipped: skippedCategories.length,
      },

      skippedCategories,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
