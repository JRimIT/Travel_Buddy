import express from "express";
import Report from "../models/Report.js";
import TripSchedule from "../models/TripSchedule.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/**
 * @swagger
 * /api/reports/trip-schedule:
 *   post:
 *     summary: Báo cáo một TripSchedule
 *     description: Người dùng đã đăng nhập có thể gửi báo cáo...
 *     tags: [Report]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetId, reason]
 *             properties:
 *               targetId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               reason:
 *                 type: string
 *                 example: "spam"
 *               description:
 *                 type: string
 *                 example: "Quảng cáo không phù hợp"
 *     responses:
 *       '201': { description: Báo cáo thành công }
 *       '400': { description: Thiếu dữ liệu / tự báo cáo / trùng }
 *       '401': { description: Token không hợp lệ }
 *       '403': { description: Không có token }
 *       '404': { description: Lịch trình không tồn tại }
 *       '500': { description: Lỗi server }
 */
router.post("/trip-schedule", async (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    // === 1. KIỂM TRA TOKEN ===
    if (!token) {
        return res.status(403).json({ success: false, message: "Không có token!" });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        console.error("JWT verify failed:", err.message);
        return res.status(401).json({ success: false, message: "Token không hợp lệ!" });
    }

    // === 2. LẤY USER ID TỪ TOKEN ===
    const reporterId = decoded.userId; // Vì bạn dùng { userId } khi tạo token
    if (!reporterId) {
        return res.status(401).json({ success: false, message: "Token không chứa userId!" });
    }

    console.log("Reporter ID từ token:", reporterId);

    // === 3. LẤY DỮ LIỆU TỪ BODY ===
    const { targetId, reason, description } = req.body;

    try {
        // 1. Kiểm tra bắt buộc
        if (!targetId || !reason) {
            return res.status(400).json({ success: false, message: "Thiếu targetId hoặc reason" });
        }

        // 2. ObjectId hợp lệ
        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({ success: false, message: "ID không hợp lệ" });
        }

        // 3. TripSchedule tồn tại?
        const tripSchedule = await TripSchedule.findById(targetId);
        if (!tripSchedule) {
            return res.status(404).json({ success: false, message: "Lịch trình không tồn tại" });
        }

        // 4. Không tự báo cáo
        if (tripSchedule.user.toString() === reporterId) {
            return res.status(400).json({ success: false, message: "Bạn không thể báo cáo lịch trình của chính mình" });
        }

        // 5. Tránh báo cáo trùng
        const existing = await Report.findOne({
            reporter: reporterId,
            targetType: "TripSchedule",
            targetId,
            status: { $in: ["pending", "reviewed"] },
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "Bạn đã báo cáo lịch trình này rồi" });
        }

        // 6. Tạo báo cáo
        const report = new Report({
            reporter: reporterId,
            targetType: "TripSchedule",
            targetId,
            reason,
            description: description || "",
        });

        await report.save();

        // 7. Ẩn lịch trình ngay lập tức để chờ admin xem xét
        if (tripSchedule.isPublic || tripSchedule.status !== "pending_review") {
            tripSchedule.isPublic = false;
            tripSchedule.status = "pending_review";
            await tripSchedule.save();
        }

        return res.status(201).json({
            success: true,
            message: "Báo cáo đã được gửi thành công. Lịch trình đã được ẩn để chờ xem xét.",
            data: report,
        });
    } catch (error) {
        console.error("Lỗi khi tạo báo cáo:", error);
        return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
    }
});

export default router;