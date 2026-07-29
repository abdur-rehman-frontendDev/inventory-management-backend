const mongoose = require("mongoose");

const POSSale = require("../models/POSSaleModel");
const Product = require("../models/Productmodel");

const generateInvoiceNumber = require("../libs/invoiceGenerator");
const logActivity = require("../libs/logger");

module.exports.createPOSInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = req.user?._id || null;
    const ipAddress = req.ip;

    const {
      customerName,
      customerPhone,
      products,
      paymentMethod,
      paidAmount,
      discount,
      tax,
      note,
    } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Please add at least one product.",
      });
    }

    let subtotal = 0;

    const saleProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      if (product.quantity < item.quantity) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: `${product.name} has only ${product.quantity} items remaining.`,
        });
      }

      const lineTotal = product.sellingPrice * item.quantity;

      subtotal += lineTotal;

      saleProducts.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        brand: product.brand,
        unit: product.unit,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        quantity: item.quantity,
        subtotal: lineTotal,
      });

      product.quantity -= item.quantity;

      await product.save({ session });
    }

    const finalDiscount = Number(discount || 0);

    const finalTax = Number(tax || 0);

    const grandTotal = subtotal - finalDiscount + finalTax;

    const paid = Number(paidAmount || 0);

    const due = grandTotal - paid;

    let paymentStatus = "Pending";

    if (paid >= grandTotal) {
      paymentStatus = "Paid";
    } else if (paid > 0) {
      paymentStatus = "Partial";
    }

    const invoiceNumber = await generateInvoiceNumber();

    const sale = await POSSale.create(
      [
        {
          invoiceNumber,

          customerName: customerName || "Walk-in Customer",

          customerPhone: customerPhone || "",

          products: saleProducts,

          subtotal,

          discount: finalDiscount,

          tax: finalTax,

          grandTotal,

          paidAmount: paid,

          dueAmount: due,

          paymentMethod: paymentMethod || "Cash",

          paymentStatus,

          note: note || "",

          createdBy: userId,

          updatedBy: userId,
        },
      ],
      { session },
    );

    await logActivity({
      action: "POS Sale",
      description: `Invoice ${invoiceNumber} created`,
      entity: "POSSale",
      entityId: sale[0]._id,
      userId,
      ipAddress,
    });

    await session.commitTransaction();

    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully.",

      sale: sale[0],
    });
  } catch (error) {
    await session.abortTransaction();

    session.endSession();

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error creating invoice.",
      error: error.message,
    });
  }
};

module.exports.getAllPOSInvoices = async (req, res) => {
  try {
    const invoices = await POSSale.find({})
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    return res.status(200).json({
      success: true,
      total: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error fetching invoices.",
      error: error.message,
    });
  }
};

module.exports.getSinglePOSInvoice = async (req, res) => {
  try {
    const invoice = await POSSale.findById(req.params.id).populate(
      "createdBy",
      "name email",
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found.",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error fetching invoice.",
      error: error.message,
    });
  }
};

module.exports.searchPOSInvoices = async (req, res) => {
  try {
    const { query } = req.query;

    const invoices = await POSSale.find({
      $or: [
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
      ],
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      total: invoices.length,
      invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
