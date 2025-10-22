import express from "express";
import TripSchedule from "../models/TripSchedule.js";
import { verifyUser } from "../config/jwtConfig.js";
import cloudinary from '../lib/cloudinary.js';
const router = express.Router();

// Tạo mới lịch trình
router.post("/create", verifyUser, async (req, res) => {
    try {
        const { title, description, budget, days, hotelDefault, flightTicket, isPublic, image } = req.body;
        const userId = req.user.userId;
        // console.log("tile: ", title);
        // console.log("description: ", description);
        // console.log("isPublic: ", isPublic);
        // console.log("budgets: ", budget);
        // console.log("schedule: ", days);
        // console.log("hotelDefault: ", hotelDefault);
        // console.log("ticketChosen: ", flightTicket);
        // console.log("User: ", userId);
        const uploadResponse = await cloudinary.uploader.upload(image)
        const imageUrl = uploadResponse.secure_url;

        const schedule = await TripSchedule.create({
            user: userId,
            title,
            description,
            budget,
            days,
            hotelDefault,
            flightTicket,
            image: imageUrl,
            isPublic: !!isPublic,
        });
        res.status(201).json({ success: true, schedule });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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
        const updated = await TripSchedule.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
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

export default router;
