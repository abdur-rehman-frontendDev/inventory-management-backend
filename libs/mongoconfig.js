const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
  };
}

async function MongoDBconfig() {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is missing in .env");
  }

  try {
    if (cached.conn) {
      return cached.conn;
    }

    cached.conn = await mongoose.connect(process.env.MONGODB_URL);

    console.log("MongoDB Connected");

    return cached.conn;
  } catch (err) {
    console.log(err);
  }
}

module.exports = { MongoDBconfig };

// const mongoose=require("mongoose")

// require("dotenv").config()

// module.exports.MongoDBconfig=()=>{
//     mongoose.connect(process.env.MONGODB_URL)
//     .then(()=>{
//         console.log("connected to database successfully")
//     })
//     .catch((err)=>{
//         console.log("MonogoDB Connection Error",err)
//     })

// }
