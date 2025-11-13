// routes/admin/reviews.js
import express from "express";
import TripSchedule from "../models/TripSchedule.js"; // SỬA ĐƯỜNG DẪN
import authMiddleware from "../middleware/auth.middleware.js";
import Review from "../models/Review.js"; // SỬA ĐƯỜNG DẪN

const router = express.Router();

// === LẤY DANH SÁCH REVIEW (BỎ adminMiddleware) ===
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "username profileImage")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit),
      Review.countDocuments(filter),
    ]);

    // Gắn tiêu đề
    const result = await Promise.all(
      reviews.map(async (r) => {
        if (r.targetType === "TripSchedule") {
          const trip = await TripSchedule.findById(r.targetId).select("title");
          r.targetTitle = trip?.title || "Đã xóa";
        }
        return r.toObject();
      })
    );

    res.json({ reviews: result, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// === CẬP NHẬT TRẠNG THÁI REVIEW (BỎ adminMiddleware) ===
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!["visible", "hidden"].includes(status)) {
      return res.status(400).json({ error: "Status không hợp lệ" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Không tìm thấy review" });

    review.status = status;
    if (adminNote) review.adminNote = adminNote;
    await review.save();

    // Cập nhật rating cho TripSchedule
    if (review.targetType === "TripSchedule") {
      const visible = await Review.find({
        targetType: "TripSchedule",
        targetId: review.targetId,
        status: "visible",
      });

      const avg = visible.length
        ? visible.reduce((s, r) => s + r.rating, 0) / visible.length
        : 0;

      await TripSchedule.updateOne(
        { _id: review.targetId },
        { averageRating: Math.round(avg * 10) / 10, reviewCount: visible.length }
      );
    }

    const updated = await Review.findById(review._id)
      .populate("user", "username profileImage");

    res.json(updated);
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

export default router;