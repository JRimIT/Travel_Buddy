import express from "express";
import axios from "axios";
import Booking from "../models/Booking.js";
import protectRoute from "../middleware/auth.middleware.js";
import { verifyUser } from "../config/jwtConfig.js";
const router = express.Router();



router.post("/", async (req, res) => {
    const { user, tripSchedule, place, amount, bookingInfo } = req.body;
    if (!user || !amount) return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    const booking = new Booking({
        user,
        tripSchedule,
        place,
        amount,
        bookingInfo,
    });
    await booking.save();
    return res.status(201).json({ success: true, booking });
});

export default router;
