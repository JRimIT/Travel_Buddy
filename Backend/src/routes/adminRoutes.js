// routes/adminRoutes.js
import express from "express";
import { verifyAdmin } from "../config/jwtConfig.js";
import TripSchedule from "../models/TripSchedule.js";
import Place from "../models/Place.js";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Report from "../models/Report.js";
import User from "../models/User.js";

const router = express.Router();

// Áp dụng verifyAdmin cho tất cả route admin
router.use(verifyAdmin);

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin panel endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSummary:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         username: { type: string }
 *         email: { type: string }
 *         phone: { type: string }
 *         isLocked: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *
 *     TripSchedule:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         title: { type: string }
 *         description: { type: string }
 *         budget:
 *           type: object
 *           properties:
 *             flight: { type: number }
 *             hotel: { type: number }
 *             fun: { type: number }
 *         days:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day: { type: integer }
 *               date: { type: string }
 *               activities:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     time: { type: string }
 *                     name: { type: string }
 *                     cost: { type: number }
 *                     place: { type: object }
 *         image: { type: string }
 *         hotelDefault: { type: object }
 *         flightTicket: { type: object }
 *         isPublic: { type: boolean, default: false }
 *         status:
 *           type: string
 *           enum: [draft, pending_review, approved, rejected]
 *           default: draft
 *         reviewedBy: { $ref: '#/components/schemas/UserSummary' }
 *         reviewedAt: { type: string, format: date-time }
 *         rejectReason: { type: string }
 *         user: { $ref: '#/components/schemas/UserSummary' }
 *         createdAt: { type: string, format: date-time }
 *         startDate: { type: string, format: date-time }
 *         endDate: { type: string, format: date-time }
 *
 *     Review:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         user: { $ref: '#/components/schemas/UserSummary' }
 *         targetId: { type: string }
 *         rating: { type: number }
 *         comment: { type: string }
 *         status: { type: string, enum: [visible, hidden] }
 *         createdAt: { type: string, format: date-time }
 *
 *     Report:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         reporter: { $ref: '#/components/schemas/UserSummary' }
 *         targetId: { type: string }
 *         reason: { type: string }
 *         status: { type: string, enum: [pending, reviewed, resolved] }
 *         reviewedBy: { $ref: '#/components/schemas/UserSummary' }
 *         reviewedAt: { type: string, format: date-time }
 *         createdAt: { type: string, format: date-time }
 *
 *     PlaceSummary:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         bookingCount: { type: number }
 *         averageRating: { type: number }
 *
 *     WeeklySales:
 *       type: object
 *       properties:
 *         total: { type: number }
 *         count: { type: integer }
 *         startDate: { type: string, format: date }
 *         endDate: { type: string, format: date }
 */

/**
 * @swagger
 * /api/admin/trips:
 *   get:
 *     summary: View all trip schedules (with optional filters)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by trip title, username, or email
 *       - in: query
 *         name: isPublic
 *         schema: { type: boolean }
 *         description: Filter by public status
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of trip schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TripSchedule'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get("/trips", async (req, res) => {
  try {
    const { search, isPublic, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (isPublic !== undefined) {
      query.isPublic = isPublic === "true";
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      const users = await User.find({ $or: [{ username: regex }, { email: regex }] }).select("_id");
      const userIds = users.map(u => u._id);

      query.$or = [
        { title: regex },
        { user: { $in: userIds } }
      ];
    }

    const [trips, total] = await Promise.all([
      TripSchedule.find(query)
        .populate("user", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TripSchedule.countDocuments(query)
    ]);

    res.json({ trips, total, page: +page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Search trips error:", error);
    res.status(500).json({ message: "Search failed", error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/trips/{id}:
 *   get:
 *     summary: Get detailed trip by ID (for admin review)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TripSchedule ID (24-character hex string)
 *     responses:
 *       200: { description: Trip details }
 *       400: { description: Invalid ID format }
 *       404: { description: Trip not found }
 */
router.get("/trips/:id", async (req, res) => {
  try {
    const { id } = req.params

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid trip ID format",
        received: id,
        expected: "24-character hex string (ObjectId)"
      })
    }

    const trip = await TripSchedule.findById(id)
      .populate("user", "username email phone")
      .populate("reviewedBy", "username")

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" })
    }

    res.json(trip)
  } catch (error) {
    console.error("Get trip detail error:", error)
    
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid ID format",
        error: error.message
      })
    }

    res.status(500).json({ message: "Server error", error: error.message })
  }
})

/**
 * @swagger
 * /api/admin/trips-pending:
 *   get:
 *     summary: Get trips waiting for review
 *     description: >
 *       Lấy danh sách chuyến đi đang chờ duyệt.  
 *       - Dữ liệu mới: `status: 'pending_review'`  
 *       - Dữ liệu cũ: `isPublic: false` và chưa có `status`
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by title or username
 *     responses:
 *       200:
 *         description: List of pending trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trips:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TripSchedule'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get("/trips-pending", async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      $or: [
        { status: "pending_review" },
        { status: { $exists: false }, isPublic: false }
      ]
    };

    // Tìm kiếm
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      const users = await User.find({ username: regex }).select("_id");
      const userIds = users.map(u => u._id);

      query = {
        $and: [
          query,
          {
            $or: [
              { title: regex },
              { user: { $in: userIds } }
            ]
          }
        ]
      };
    }

    const [trips, total] = await Promise.all([
      TripSchedule.find(query)
        .populate("user", "username email phone")
        .populate("reviewedBy", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TripSchedule.countDocuments(query)
    ]);

    res.json({ trips, total, page: +page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get pending trips error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: Get all reviews (with status filter)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [visible, hidden] }
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 */
router.get("/reviews", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reviews = await Review.find(filter)
      .populate("user", "username")
      .populate("targetId", "name title type")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/sales/weekly:
 *   get:
 *     summary: Get weekly sales report
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: week
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Weekly sales
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WeeklySales'
 */
router.get("/sales/weekly", async (req, res) => {
  try {
    let startDate, endDate;
    if (req.query.year && req.query.week) {
      const year = parseInt(req.query.year);
      const week = parseInt(req.query.week);
      startDate = new Date(year, 0, (week - 1) * 7 + 1);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      const now = new Date();
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    }

    const result = await Booking.aggregate([
      { $match: { bookingDate: { $gte: startDate, $lte: endDate }, status: "confirmed" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    res.json({
      total: result[0]?.total || 0,
      count: result[0]?.count || 0,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/places/top:
 *   get:
 *     summary: Get top booked or highly rated places
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [bookingCount, averageRating], default: bookingCount }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Top places
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PlaceSummary'
 */
router.get("/places/top", async (req, res) => {
  try {
    const { sortBy = "bookingCount", limit = 10 } = req.query;
    const validSort = ["bookingCount", "averageRating"].includes(sortBy) ? sortBy : "bookingCount";

    const places = await Place.find()
      .sort({ [validSort]: -1 })
      .limit(parseInt(limit))
      .select("name bookingCount averageRating");

    res.json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Get all user violation reports
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, reviewed, resolved] }
 *     responses:
 *       200:
 *         description: List of reports
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Report'
 */
router.get("/reports", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reports = await Report.find(filter)
      .populate("reporter", "username")
      .populate("targetId")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: View all users with search and pagination
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: field
 *         schema: { type: string, enum: [username, email, phone] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserSummary'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get("/users", async (req, res) => {
  try {
    const { search, field, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      if (field && ["username", "email", "phone"].includes(field)) {
        query[field] = regex;
      } else {
        query.$or = [{ username: regex }, { email: regex }, { phone: regex }];
      }
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("username email phone isLocked createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    res.json({ users, total, page: +page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Search failed", error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/sales/total:
 *   get:
 *     summary: Get overall revenue from all confirmed bookings
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Total revenue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue: { type: number }
 *                 totalBookings: { type: integer }
 */
router.get("/sales/total", async (req, res) => {
  try {
    const result = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" }, totalBookings: { $sum: 1 } } }
    ]);

    res.json({
      totalRevenue: result[0]?.totalRevenue || 0,
      totalBookings: result[0]?.totalBookings || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/trips/{id}/approve:
 *   post:
 *     summary: Approve and publish a trip
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TripSchedule ID
 *     responses:
 *       200:
 *         description: Trip approved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 trip: { $ref: '#/components/schemas/TripSchedule' }
 *       404: { description: Trip not found }
 *       400: { description: Trip not eligible for approval }
 */
router.post("/trips/:id/approve", async (req, res) => {
  try {
    const trip = await TripSchedule.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    // KIỂM TRA ĐIỀU KIỆN HỢP LỆ
    const isPending = 
      trip.status === "pending_review" || 
      (!trip.status && trip.isPublic === false);

    if (!isPending) {
      return res.status(400).json({
        message: "Trip is not pending review",
        currentStatus: trip.status,
        isPublic: trip.isPublic
      });
    }

    // CẬP NHẬT
    trip.status = "approved";
    trip.isPublic = true;
    trip.reviewedBy = req.user._id;
    trip.reviewedAt = new Date();
    trip.rejectReason = null;

    await trip.save();

    res.json({ message: "Trip approved and published", trip });
  } catch (error) {
    console.error("Approve trip error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/trips/{id}/reject:
 *   post:
 *     summary: Reject a trip with reason
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TripSchedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Nội dung không phù hợp" }
 *             required: [reason]
 *     responses:
 *       200:
 *         description: Trip rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 trip: { $ref: '#/components/schemas/TripSchedule' }
 *       404: { description: Trip not found }
 *       400: { description: Missing reason or trip not pending }
 */
router.post("/trips/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ message: "Reason is required" });

    const trip = await TripSchedule.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    // KIỂM TRA ĐIỀU KIỆN HỢP LỆ
    const isPending = 
      trip.status === "pending_review" || 
      (!trip.status && trip.isPublic === false);

    if (!isPending) {
      return res.status(400).json({
        message: "Trip is not pending review",
        currentStatus: trip.status,
        isPublic: trip.isPublic
      });
    }

    // CẬP NHẬT
    trip.status = "rejected";
    trip.isPublic = false;
    trip.reviewedBy = req.user._id;
    trip.reviewedAt = new Date();
    trip.rejectReason = reason.trim();

    await trip.save();

    res.json({ message: "Trip rejected", trip });
  } catch (error) {
    console.error("Reject trip error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reviews/{id}/hide:
 *   put:
 *     summary: Hide a review
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Review hidden }
 */
router.put("/reviews/:id/hide", async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { status: "hidden" });
    res.json({ message: "Review hidden" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reviews/{id}/show:
 *   put:
 *     summary: Show a hidden review
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Review visible again }
 */
router.put("/reviews/:id/show", async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { status: "visible" });
    res.json({ message: "Review visible" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reports/{id}/resolve:
 *   put:
 *     summary: Mark report as resolved
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Report resolved }
 */
router.put("/reports/:id/resolve", async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, {
      status: "resolved",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    });
    res.json({ message: "Report resolved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/lock:
 *   put:
 *     summary: Lock a user account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User account locked }
 *       404: { description: User not found }
 */
router.put("/users/:id/lock", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isLocked: true },
      { new: true }
    ).select("username isLocked");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User account locked", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}/unlock:
 *   put:
 *     summary: Unlock a user account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User account unlocked }
 *       404: { description: User not found }
 */
router.put("/users/:id/unlock", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isLocked: false },
      { new: true }
    ).select("username isLocked");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User account unlocked", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Admin route working!" });
});

export default router;