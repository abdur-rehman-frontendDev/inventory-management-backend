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

// const mongoose = require("mongoose");

// const POSProductSchema = new mongoose.Schema(
//   {
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },

//     productName: {
//       type: String,
//       required: true,
//     },

//     sku: {
//       type: String,
//       required: true,
//     },

//     barcode: {
//       type: String,
//       default: "",
//     },

//     brand: {
//       type: String,
//       default: "",
//     },

//     unit: {
//       type: String,
//       default: "Piece",
//     },

//     purchasePrice: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     sellingPrice: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     quantity: {
//       type: Number,
//       required: true,
//       min: 1,
//     },

//     subtotal: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//   },
//   {
//     _id: false,
//   }
// );

// const POSSaleSchema = new mongoose.Schema(
//   {
//     invoiceNumber: {
//       type: String,
//       required: true,
//       unique: true,
//       index: true,
//     },

//     customerName: {
//       type: String,
//       default: "Walk-in Customer",
//       trim: true,
//     },

//     customerPhone: {
//       type: String,
//       default: "",
//       trim: true,
//     },

//     products: {
//       type: [POSProductSchema],
//       validate: {
//         validator: function (value) {
//           return value.length > 0;
//         },
//         message: "Invoice must contain at least one product.",
//       },
//     },

//     subtotal: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     discount: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     tax: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     grandTotal: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     paidAmount: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     dueAmount: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     paymentMethod: {
//       type: String,
//       enum: ["Cash", "Card", "Bank", "JazzCash", "EasyPaisa"],
//       default: "Cash",
//     },

//     paymentStatus: {
//       type: String,
//       enum: ["Paid", "Refunded", "Pending"],
//       default: "Paid",
//     },

//     saleStatus: {
//       type: String,
//       enum: ["Completed", "Cancelled", "Returned"],
//       default: "Completed",
//     },

//     note: {
//       type: String,
//       default: "",
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },

//     updatedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// POSSaleSchema.index({ createdAt: -1 });
// POSSaleSchema.index({ customerName: 1 });
// POSSaleSchema.index({ customerPhone: 1 });

// module.exports = mongoose.model("POSSale", POSSaleSchema);
