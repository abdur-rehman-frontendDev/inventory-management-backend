const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { MongoDBconfig } = require("../libs/mongoconfig");

const authrouter = require("../Routers/authRouther");
const productrouter = require("../Routers/ProductRouter");
const orderrouter = require("../Routers/orderRouter");
const categoryrouter = require("../Routers/categoryRouter");
const notificationrouter = require("../Routers/notificationRouters");
// const activityrouter = require("../Routers/activityRouter");
const inventoryrouter = require("../Routers/inventoryRouter");
const salesrouter = require("../Routers/salesRouter");
const supplierrouter = require("../Routers/supplierrouter");
const stocktransactionrouter = require("../Routers/stocktransactionrouter");

const app = express();

MongoDBconfig();

const allowedOrigins = [
  "https://mumeez-inventory.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
  }),
);

// app.use(cors({
//   origin: [
//     "https://mumeez-inventory.vercel.app",
//     "http://localhost:3000"
//   ],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));

// app.options("*", cors());

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());


app.options("*", (req,res)=>{

res.header(
"Access-Control-Allow-Origin",
req.headers.origin
);

res.header(
"Access-Control-Allow-Credentials",
"true"
);

res.header(
"Access-Control-Allow-Headers",
"Content-Type, Authorization"
);

res.header(
"Access-Control-Allow-Methods",
"GET,POST,PUT,DELETE,OPTIONS"
);

res.sendStatus(200);

});

app.use("/api/auth", authrouter);
app.use("/api/product", productrouter);
app.use("/api/order", orderrouter);
app.use("/api/category", categoryrouter);
app.use("/api/notification", notificationrouter);
// app.use("/api/activitylogs", activityrouter);
app.use("/api/inventory", inventoryrouter);
app.use("/api/sales", salesrouter);
app.use("/api/supplier", supplierrouter);
app.use("/api/stocktransaction", stocktransactionrouter);

app.get("/", (req, res) => {
  res.send("Backend Running Successfully");
});

module.exports = app;
