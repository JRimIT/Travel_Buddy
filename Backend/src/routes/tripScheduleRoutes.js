import express from "express";
import TripSchedule from "../models/TripSchedule.js";
import { verifyUser } from "../config/jwtConfig.js";
import cloudinary from "../lib/cloudinary.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import Review from "../models/Review.js";

const router = express.Router();

// Tạo mới lịch trình
router.post("/create", verifyUser, async (req, res) => {
    try {
        const {
            title, description, isPublic, budget,
            days, baseStay, hotelDefault, flightTicket, ticket, image,
            mainTransport, innerTransport, fromLocation,
            province, baseStayType, startDate, endDate, bookingStatus
        } = req.body;

        let scheduleData = {
            user: req.user.userId,
            title, description, isPublic, budget,
            days, flightTicket, ticket: req.body.ticket, image,
            mainTransport, innerTransport, fromLocation, province, startDate, endDate, bookingStatus
        };

        if (baseStayType === "home" && baseStay) {
            scheduleData.home = baseStay;
        }
        if (baseStayType === "hotel" && hotelDefault) {
            scheduleData.hotelDefault = hotelDefault;
        }

        const trip = await TripSchedule.create(scheduleData);
        res.json({ success: true, tripId: trip._id });
    } catch (err) {
        console.error("[TripSchedule.create]", err);
        res.status(500).json({ error: "Lưu lịch trình thất bại!" });
    }
});

// Lấy tất cả lịch trình của user
router.get("/my", verifyUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const schedules = await TripSchedule.find({ user: userId }).sort({ createdAt: -1 });
        res.json(schedules);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Lấy tất cả lịch trình công khai
router.get("/public", async (req, res) => {
    try {
        const schedules = await TripSchedule.find({ isPublic: true })
            .populate("user", "username profileImage")
            .sort({ createdAt: -1 });

        // Lấy reviews cho từng trip
        const tripIds = schedules.map(t => t._id);
        const reviews = await mongoose.model("Review").find({
            targetType: "TripSchedule",
            targetId: { $in: tripIds },
            status: "visible"
        }).populate("user", "username profileImage");

        const reviewMap = {};
        reviews.forEach(r => {
            if (!reviewMap[r.targetId]) reviewMap[r.targetId] = [];
            reviewMap[r.targetId].push(r);
        });

        const result = schedules.map(t => ({
            ...t.toObject(),
            reviews: reviewMap[t._id] || [],
            averageRating: t.averageRating || 0,
            reviewCount: t.reviewCount || 0
        }));

        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// CHI TIẾT LỊCH TRÌNH – BẮT BUỘC TRẢ VỀ REVIEWS NHƯ TRANG CHỦ
router.get("/:id", async (req, res) => {
    try {
        const trip = await TripSchedule.findById(req.params.id)
            .populate("user", "username profileImage")
            .populate({
                path: "reviews",
                match: { status: "visible", targetType: "TripSchedule" }, // THÊM targetType!!!
                populate: { path: "user", select: "username profileImage" },
                options: { sort: { createdAt: -1 }, limit: 10 }
            });

        if (!trip) {
            return res.status(404).json({ error: "Không tìm thấy lịch trình" });
        }

        // QUAN TRỌNG NHẤT: ÉP TRẢ VỀ reviews, averageRating, reviewCount
        const result = {
            ...trip.toObject(),
            averageRating: trip.averageRating || 0,
            reviewCount: trip.reviewCount || 0,
            reviews: trip.reviews || []   // ← DÒNG QUAN TRỌNG NHẤT!!!
        };

        res.json(result);
    } catch (e) {
        console.error("Lỗi lấy chi tiết trip:", e);
        res.status(500).json({ error: e.message });
    }
});

// Sửa lịch trình
router.put("/:id", verifyUser, async (req, res) => {
    try {
        const id = req.params.id;
        const updateFields = {};
        const allowed = ["title", "description", "isPublic"];

        allowed.forEach(field => {
            if (req.body[field] !== undefined) updateFields[field] = req.body[field];
        });

        const trip = await TripSchedule.findOneAndUpdate(
            { _id: id, user: req.user.userId },
            { $set: updateFields },
            { new: true }
        );
        if (!trip) return res.status(404).json({ error: "Không tìm thấy lịch trình" });
        res.json({ success: true, trip });
    } catch (err) {
        res.status(500).json({ error: "Không thể cập nhật", detail: err.message });
    }
});

// Xóa lịch trình
router.delete("/:id", verifyUser, async (req, res) => {
    try {
        await TripSchedule.deleteOne({ _id: req.params.id, user: req.user.userId });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/:id/save', verifyUser, async (req, res) => {
    try {
        const tripId = req.params.id;
        // 1. Validate ObjectId, tránh lỗi CastError
        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({ error: 'Invalid trip id' });
        }

        const user = await User.findById(req.user.userId);
        if (!user)
            return res.status(404).json({ error: 'User not found' });

        // KHỞI TẠO MẢNG NẾU CHƯA TỒN TẠI
        if (!user.savedTripSchedules) user.savedTripSchedules = [];

        const isSaved = user.savedTripSchedules
            .map(id => id.toString())
            .includes(tripId);

        if (isSaved) {
            // Bỏ lưu
            user.savedTripSchedules.pull(tripId);
            await user.save();
            return res.json({ success: true, message: 'Trip unsaved' });
        } else {
            // Lưu nếu chưa
            user.savedTripSchedules.push(tripId);
            await user.save();
            return res.json({ success: true, message: 'Trip saved' });
        }
    } catch (err) {
        console.error("ERROR in /tripSchedule/:id/save", err); // log chi tiết lỗi
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// === LẤY LỊCH TRÌNH ĐÃ LƯU ===
router.get("/saved/my", verifyUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate({
                path: 'savedTripSchedules',
                populate: { path: 'user', select: 'username profileImage' }
            });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.savedTripSchedules);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// === ĐÁNH DẤU "ĐÃ ĐI" ===
router.post("/:id/complete", verifyUser, async (req, res) => {
    try {
        const tripId = req.params.id;
        const trip = await TripSchedule.findById(tripId);
        if (!trip) return res.status(404).json({ error: "Lịch trình không tồn tại" });

        // Phải lưu trước mới được đánh dấu
        const user = await User.findById(req.user.userId);
        if (!user.savedTripSchedules.includes(tripId)) {
            return res.status(403).json({ error: "Bạn cần lưu lịch trình trước" });
        }

        const isCompleted = trip.completedBy.includes(req.user.userId);

        if (isCompleted) {
            trip.completedBy.pull(req.user.userId);
        } else {
            trip.completedBy.addToSet(req.user.userId);
        }

        await trip.save();
        res.json({ completed: !isCompleted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// === LẤY DANH SÁCH "ĐÃ ĐI" ===
router.get("/completed/my", verifyUser, async (req, res) => {
    try {
        const trips = await TripSchedule.find({
            completedBy: req.user.userId,
            isPublic: true
        }).select("_id");

        res.json(trips);
    } catch (error) {
        console.error("Error fetching completed trips:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// YÊU CẦU: phải import verifyUser từ middleware xác thực token

router.delete("/save/:tripId", verifyUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { tripId } = req.params;

        // Xoá tripId khỏi mảng savedTripSchedules của user
        await User.findByIdAndUpdate(userId, {
            $pull: { savedTripSchedules: tripId }
        });

        res.json({ success: true, message: "Đã bỏ lưu chuyến đi" });
    } catch (error) {
        res.status(500).json({ error: "Không bỏ lưu được chuyến đi" });
    }
});


export default router;