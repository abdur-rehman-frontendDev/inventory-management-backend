const mongoose = require("mongoose");

const Product = require("../models/Productmodel");
const POSSale = require("../models/POSSaleModel");

const generateInvoiceNumber = require("../libs/invoiceGenerator");

module.exports.createPOSSale = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      customerName,
      customerPhone,
      paymentMethod,
      paymentStatus,
      discount = 0,
      tax = 0,
      paidAmount = 0,
      dueAmount = 0,
      notes = "",
      items,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Products are required",
      });
    }

    const invoiceNumber = await generateInvoiceNumber();

    let subtotal = 0;

    const saleItems = [];

    //----------------------------------------------------
    // Loop Products
    //----------------------------------------------------

    for (const item of items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message: `${item.product} not found`,
        });
      }

      if (product.quantity < item.quantity) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: `${product.name} stock is not enough`,
        });
      }

      //----------------------------------------------------
      // decrease stock
      //----------------------------------------------------

      product.quantity -= item.quantity;

      await product.save({ session });

      //----------------------------------------------------
      // totals
      //----------------------------------------------------

      const lineTotal = item.quantity * product.sellingPrice;

      subtotal += lineTotal;

      saleItems.push({
        product: product._id,

        name: product.name,

        sku: product.sku,

        barcode: product.barcode,

        quantity: item.quantity,

        unitPrice: product.sellingPrice,

        purchasePrice: product.purchasePrice,

        lineTotal,
      });
    }

    //----------------------------------------------------
    // Final Calculations
    //----------------------------------------------------

    const grandTotal = subtotal - discount + tax;

    const totalProfit = saleItems.reduce((sum, item) => {
      return sum + (item.unitPrice - item.purchasePrice) * item.quantity;
    }, 0);

    //----------------------------------------------------
    // Save Sale
    //----------------------------------------------------

    const sale = await POSSale.create(
      [
        {
          invoiceNumber,
          customerName,
          customerPhone,
          items: saleItems,
          subtotal,
          discount,
          tax,
          grandTotal,
          paidAmount,
          dueAmount,
          totalProfit,
          paymentMethod,
          paymentStatus,
          status: "Completed",
          notes,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    session.endSession();

    return res.status(201).json({
      success: true,

      message: "Sale completed",

      sale: sale[0],
    });
  } catch (error) {
    await session.abortTransaction();

    session.endSession();

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getAllPOSSales = async (req, res) => {
  try {
    const sales = await POSSale.find()
      .populate({
        path: "items.product",
        select: "name sku barcode brand unit sellingPrice",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalSales: sales.length,
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

module.exports.getPOSSaleById = async (req, res) => {
  try {
    const sale = await POSSale.findById(req.params.id).populate({
      path: "items.product",
      populate: {
        path: "Category",
        select: "name",
      },
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.status(200).json({
      success: true,
      sale,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.searchPOSSales = async (req, res) => {
  try {
    const { query } = req.query;

    const filter = {};

    if (query && query.trim()) {
      filter.$or = [
        {
          invoiceNumber: {
            $regex: query,
            $options: "i",
          },
        },
        {
          customerName: {
            $regex: query,
            $options: "i",
          },
        },
        {
          customerPhone: {
            $regex: query,
            $options: "i",
          },
        },
      ];
    }

    const sales = await POSSale.find(filter)
      .populate("items.product")
      .sort({ createdAt: -1 });

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

module.exports.getTodaySales = async (req, res) => {
  try {
    const start = new Date();

    start.setHours(0, 0, 0, 0);

    const end = new Date();

    end.setHours(23, 59, 59, 999);

    const sales = await POSSale.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
    });

    const totalSales = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);

    const totalProfit = sales.reduce((sum, sale) => sum + sale.totalProfit, 0);

    res.json({
      success: true,
      orders: sales.length,
      totalSales,
      totalProfit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getRecentSales = async (req, res) => {
  try {
    const sales = await POSSale.find().sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      sales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.cancelPOSSale = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const sale = await POSSale.findById(req.params.id).session(session);

    if (!sale) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    if (sale.status === "Cancelled") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Sale already cancelled",
      });
    }

    //------------------------------------------------
    // Restore Stock
    //------------------------------------------------

    for (const item of sale.items) {
      const product = await Product.findById(item.product).session(session);

      if (product) {
        product.quantity += item.quantity;

        await product.save({
          session,
        });
      }
    }

    sale.status = "Cancelled";

    sale.paymentStatus = "Refunded";

    await sale.save({
      session,
    });

    await session.commitTransaction();

    session.endSession();

    res.json({
      success: true,
      message: "Sale cancelled successfully",
    });
  } catch (error) {
    await session.abortTransaction();

    session.endSession();

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
