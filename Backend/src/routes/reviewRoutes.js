import express from "express";
import { verifyUser } from "../config/jwtConfig.js";
import Review from "../models/Review.js";
import TripSchedule from "../models/TripSchedule.js";
import User from "../models/User.js";

const router = express.Router();

// GỬI REVIEW CHO LỊCH TRÌNH
router.post("/trip-schedule/:tripId", verifyUser, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating từ 1-5" });
    }
    if (!comment?.trim()) {
      return res.status(400).json({ error: "Vui lòng nhập nhận xét" });
    }

    // Kiểm tra lịch trình
    const trip = await TripSchedule.findById(tripId);
    if (!trip || !trip.isPublic) {
      return res.status(404).json({ error: "Lịch trình không tồn tại" });
    }

    // Kiểm tra đã lưu
    const user = await User.findById(userId);
    if (!user.savedTripSchedules.includes(tripId)) {
      return res.status(403).json({ error: "Bạn cần lưu lịch trình trước" });
    }

    // Kiểm tra đã đi
    if (!trip.completedBy.includes(userId)) {
      return res.status(403).json({ error: "Bạn cần đánh dấu 'đã đi'" });
    }

    // Kiểm tra chưa review
    const existing = await Review.findOne({
      user: userId,
      targetId: tripId,
      targetType: "TripSchedule"
    });
    if (existing) {
      return res.status(400).json({ error: "Bạn đã đánh giá rồi" });
    }

    // Tạo review
    const review = await Review.create({
      user: userId,
      targetId: tripId,
      targetType: "TripSchedule",
      rating: parseInt(rating),
      comment: comment.trim(),
      status: "visible"
    });

    // Cập nhật lại averageRating và reviewCount cho trip (chỉ tính các review status = "visible")
    const reviews = await Review.find({
      targetId: tripId,
      targetType: "TripSchedule",
      status: "visible"
    });

    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0
      ? Math.round((reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviewCount) * 10) / 10
      : 0;

    // Cập nhật trip với reviewCount và averageRating
    await TripSchedule.findByIdAndUpdate(tripId, { 
      reviewCount, 
      averageRating 
    });
    
    console.log(`[REVIEW] Đã cập nhật trip ${tripId} - reviewCount: ${reviewCount}, averageRating: ${averageRating}`);


    res.json({ success: true, review });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;
