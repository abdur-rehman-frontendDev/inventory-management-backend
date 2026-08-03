const mongoose = require("mongoose");

const POSItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    sku: {
      type: String,
      required: true,
    },

    barcode: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    purchasePrice: {
      type: Number,
      required: true,
    },

    unitPrice: {
      type: Number,
      required: true,
    },

    lineTotal: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const POSSaleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customerName: {
      type: String,
      default: "Walk-in Customer",
    },

    customerPhone: {
      type: String,
      default: "",
    },

    items: {
      type: [POSItemSchema],
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
    },

    discount: {
      type: Number,
      default: 0,
    },

    tax: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    dueAmount: {
      type: Number,
      default: 0,
    },

    totalProfit: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Bank", "JazzCash", "EasyPaisa"],
      default: "Cash",
    },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Partial", "Pending", "Refunded"],
      default: "Paid",
    },

    status: {
      type: String,
      enum: ["Completed", "Cancelled", "Returned"],
      default: "Completed",
    },

    notes: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

POSSaleSchema.index({
  createdAt: -1,
});

POSSaleSchema.index({
  customerName: 1,
});

POSSaleSchema.index({
  customerPhone: 1,
});

module.exports = mongoose.model("POSSale", POSSaleSchema);