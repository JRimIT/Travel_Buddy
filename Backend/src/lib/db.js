// lib/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectToMongoDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI không được định nghĩa trong file .env");
    }
    await mongoose.connect(uri);
    console.log("Kết nối thành công tới MongoDB");
  } catch (error) {
    console.error("Lỗi kết nối tới MongoDB:", error.message);
  }
};