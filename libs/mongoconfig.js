const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function MongoDBconfig() {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is missing");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set("bufferCommands", false);

    cached.promise = mongoose.connect(process.env.MONGODB_URL, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;

    console.log("✅ MongoDB Connected");

    return cached.conn;
  } catch (err) {
    cached.promise = null;

    console.error("MongoDB Connection Error:", err);

    throw err;
  }
}

module.exports = { MongoDBconfig };
