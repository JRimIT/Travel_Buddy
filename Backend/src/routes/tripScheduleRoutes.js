import express from "express";
import TripSchedule from "../models/TripSchedule.js";
import { verifyUser } from "../config/jwtConfig.js";
import cloudinary from '../lib/cloudinary.js';
import User from '../models/User.js';

const router = express.Router();

// Tạo mới lịch trình
router.post("/create", verifyUser, async (req, res) => {
    try {
        const {
            title, description, isPublic, budget,
            days, baseStay, hotelDefault, flightTicket, image,
            mainTransport, innerTransport, fromLocation,
            province, baseStayType, startDate, endDate
        } = req.body;

        let scheduleData = {
            user: req.user.userId,
            title, description, isPublic, budget,
            days, flightTicket, image,
            mainTransport, innerTransport, fromLocation, province, startDate, endDate
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


// Lấy tất cả lịch trình của user (riêng tư + công khai)
router.get("/my", verifyUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const schedules = await TripSchedule.find({ user: userId }).sort({ createdAt: -1 });
        res.json(schedules);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Lấy tất cả lịch trình công khai (dùng cho explore/du lịch cộng đồng)
router.get("/public", async (req, res) => {
    try {
        const schedules = await TripSchedule.find({ isPublic: true }).populate("user", "username email profileImage").sort({ createdAt: -1 });
        res.json(schedules);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Xem chi tiết 1 lịch trình
router.get("/:id", async (req, res) => {
    try {
        const schedule = await TripSchedule.findById(req.params.id).populate("user");
        if (!schedule) return res.status(404).json({ error: "Not found" });
        res.json(schedule);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Sửa history của user
router.put("/:id", verifyUser, async (req, res) => {
    try {
        const id = req.params.id;
        // chỉ cho update một số trường cho phép (cần validate nếu muốn)
        const updateFields = {};
        const allowed = ["title", "description", "isPublic"]; // bổ sung field khác nếu muốn

        allowed.forEach(field => {
            if (req.body[field] !== undefined) updateFields[field] = req.body[field];
        });

        const trip = await TripSchedule.findOneAndUpdate(
            { _id: id, user: req.user.userId }, // chỉ owner sửa được
            { $set: updateFields },
            { new: true }
        );
        if (!trip) return res.status(404).json({ error: "Không tìm thấy lịch trình" });
        res.json({ success: true, trip });
    } catch (err) {
        res.status(500).json({ error: "Không thể cập nhật", detail: err.message });
    }
});

// Xoá lịch trình của user
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
    const user = await User.findById(req.user.userId);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const isSaved = user.savedTripSchedules.includes(tripId);

    if (isSaved) {
      // Nếu đã lưu -> Bỏ lưu
      user.savedTripSchedules.pull(tripId);
      await user.save();
      res.json({ success: true, message: 'Trip unsaved' });
    } else {
      // Nếu chưa lưu -> Lưu
      user.savedTripSchedules.push(tripId);
      await user.save();
      res.json({ success: true, message: 'Trip saved' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Thêm route để lấy các trip đã lưu
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

export default router;
