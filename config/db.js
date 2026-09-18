import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  if (process.env.MOCK_DB === "true") {
    console.log("MongoDB is running in MOCK mode (in-memory data used)");
    isConnected = true;
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in environment variables");
  }

  const conn = await mongoose.connect(process.env.MONGO_URI);
  isConnected = conn.connections[0].readyState === 1;
  console.log(`MongoDB connected: ${conn.connection.host}`);
};
