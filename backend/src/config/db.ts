import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === "") {
    console.log("ℹ️  MONGODB_URI not provided in .env. Running in seamless High-Speed In-Memory DB Mode.");
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log("✅ Successfully connected to MongoDB Atlas!");
    return true;
  } catch (error) {
    console.warn("⚠️  Could not connect to MongoDB Atlas. Falling back to High-Speed In-Memory DB Mode.", (error as Error).message);
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}
