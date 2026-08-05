const Product = require("../models/Productmodel");
const Category = require("../models/Categorymodel");
const logActivity = require("../libs/logger");
const StockTransaction = require("../models/StockTranscationmodel");
const paginate = require("../helpers/pagination");

module.exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const userId = req.user._id;
    const ipAddress = req.ip;

    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Please provide all necessary information." });
    }

    const newCategory = new Category({
      name,
      description,
    });

    await logActivity({
      action: "Add Category",
      description: `Category "${name} was added`,
      entity: "category",
      entityId: newCategory._id,
      userId: userId,
      ipAddress: ipAddress,
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in creating Category", error: error.message });
  }
};

module.exports.RemoveCategory = async (req, res) => {
  try {
    const { CategoryId } = req.params;
    const userId = req.user._id;
    const ipAddress = req.ip;
    const DeletedCategory = await Category.findByIdAndDelete(CategoryId);

    if (!DeletedCategory) {
      return res.status(404).json({ message: "Category is not found!" });
    }

    await logActivity({
      action: "Delete Category",
      description: `Category "${DeletedCategory.name}" was deleted.`,
      entity: "category",
      entityId: DeletedCategory._id,
      userId: userId,
      ipAddress: ipAddress,
    });

    res.status(200).json({ message: "Category delete successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting Category", error: error.message });
  }
};

module.exports.getCategory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const result = await paginate({
      model: Category,
      page,
      limit,
      sort: { createdAt: -1 },
    });

    const categoriesWithCount = await Promise.all(
      result.data.map(async (category) => {
        const count = await Product.countDocuments({
          Category: category._id,
        });

        return {
          ...category.toObject(),
          productCount: count,
        };
      })
    );

    res.status(200).json({
      categories: categoriesWithCount,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting categories",
      error: error.message,
    });
  }
};

module.exports.updateCategory = async (req, res) => {
  try {
    const { updatedCategory } = req.body;
    const { CategoryId } = req.params;
    const userId = req.user._id;
    const ipAddress = req.ip;

    const updatingCategory = await Category.findByIdAndUpdate(
      CategoryId,
      updatedCategory,
      { new: true },
    );

    if (!updatingCategory) {
      return res.status(400).json({ message: "Category is not found" });
    }

    await logActivity({
      action: "Update Category",
      description: `Category "${updatingCategory.name}" was updated.`,
      entity: "category",
      entityId: updatingCategory._id,
      userId: userId,
      ipAddress: ipAddress,
    });

    res.status(200).json({ message: "Category successfully updated" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error in update status Category",
        error: error.message,
      });
  }
};

module.exports.Searchcategory = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        message: "Query parameter is required",
      });
    }

    const result = await paginate({
      model: Category,
      page,
      limit,
      query: {
        $or: [
          {
            name: {
              $regex: query,
              $options: "i",
            },
          },
          {
            description: {
              $regex: query,
              $options: "i",
            },
          },
        ],
      },
      sort: { createdAt: -1 },
    });

    const categoriesWithCount = await Promise.all(
      result.data.map(async (category) => {
        const count = await Product.countDocuments({
          Category: category._id,
        });

        return {
          ...category.toObject(),
          productCount: count,
        };
      })
    );

    res.status(200).json({
      categories: categoriesWithCount,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error finding category",
      error: error.message,
    });
  }
};
