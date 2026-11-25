import mongoose from "mongoose";

export const connectDB = async (uri) => {
  try {
    if (!uri) {
      throw new Error("MONGO_URI environment variable is missing in .env file.");
    }
    const sanitized = uri.replace(/:([^:@]+)@/, ":****@");
    console.log(`Connecting to MongoDB: ${sanitized}`);
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
