// models/Review.js
import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: ["TripSchedule", "Place"], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  status: { type: String, enum: ["pending", "visible", "hidden"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

// Index để tìm nhanh
ReviewSchema.index({ targetId: 1, targetType: 1 });
ReviewSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });

export default mongoose.model("Review", ReviewSchema);