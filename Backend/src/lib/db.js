// lib/db.js
import mongoose from "mongoose";
// MONGODB_URI=mongodb+srv://tphuc9398_db_user:admin123@truongcluster.nq3ga4g.mongodb.net/travelbuddy?retryWrites=true&w=majority&appName=truongcluster
export const connectToMongoDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://tphuc9398_db_user:admin123@truongcluster.nq3ga4g.mongodb.net/travelbuddy?retryWrites=true&w=majority&appName=truongcluster')
    console.log("Connect to MongoDB");

  } catch (error) {
    console.log("Error connecting to MongoDB", error.message);

  }
}