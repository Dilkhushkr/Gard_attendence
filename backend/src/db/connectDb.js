const mongoose = require("mongoose");

async function connectDb() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MongoDB connection string. Set MONGO_URI in .env.");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}

module.exports = connectDb;
