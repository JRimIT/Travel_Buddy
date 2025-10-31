// routes/adminRoutes.js
import express from "express";
import { verifyAdmin } from "../config/jwtConfig.js";
import TripSchedule from "../models/TripSchedule.js";
import TripApproval from "../models/TripApproval.js";
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
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         isLocked:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     TripSchedule:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         isPublic:
 *           type: boolean
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Review:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *         targetId:
 *           type: string
 *         rating:
 *           type: number
 *         comment:
 *           type: string
 *         status:
 *           type: string
 *           enum: [visible, hidden]
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Report:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         reporter:
 *           $ref: '#/components/schemas/UserSummary'
 *         targetId:
 *           type: string
 *           description: ID of reported entity (user, review, trip, etc.)
 *         reason:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, reviewed, resolved]
 *         reviewedBy:
 *           $ref: '#/components/schemas/UserSummary'
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     TripApproval:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         tripSchedule:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         admin:
 *           type: string
 *         reason:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PlaceSummary:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         bookingCount:
 *           type: number
 *         averageRating:
 *           type: number
 *
 *     WeeklySales:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *         count:
 *           type: integer
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
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
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
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
      query.title = regex;
    }

    const [trips, total] = await Promise.all([
      TripSchedule.find(query)
        .populate("user", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TripSchedule.countDocuments(query)
    ]);

    res.json({
      trips,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Search trips error:", error);
    res.status(500).json({ message: "Search failed", error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/trip-approvals:
 *   get:
 *     summary: Get all trip approval requests
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of approval requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TripApproval'
 */
router.get("/trip-approvals", async (req, res) => {
  try {
    const approvals = await TripApproval.find()
      .populate({
        path: "tripSchedule",
        populate: { path: "user", select: "username email" },
      })
      .populate("admin", "username")
      .sort({ createdAt: -1 });
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});//da test ok chay dc

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
});//ok chay dc

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
      {
        $match: {
          bookingDate: { $gte: startDate, $lte: endDate },
          status: "confirmed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
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
});//chay dc lay ra revenue trong 1 tuan gan nhat

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
 *         schema:
 *           type: string
 *           enum: [bookingCount, averageRating]
 *           default: bookingCount
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
    const validSort = ["bookingCount", "averageRating"].includes(sortBy)
      ? sortBy
      : "bookingCount";

    const places = await Place.find()
      .sort({ [validSort]: -1 })
      .limit(parseInt(limit))
      .select("name bookingCount averageRating");

    res.json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});//ok

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
});//ok

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
 *         description: Search term (username, email, phone)
 *       - in: query
 *         name: field
 *         schema: { type: string, enum: [username, email, phone] }
 *         description: Field to search in
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
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */
router.get("/users", async (req, res) => {
  try {
    const { search, field, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (search && search.trim()) {
      const searchStr = search.trim();
      const regex = new RegExp(searchStr, "i");

      if (field && ["username", "email", "phone"].includes(field)) {
        query[field] = regex;
      } else {
        // Tìm trong nhiều field
        query.$or = [
          { username: regex },
          { email: regex },
          { phone: regex }
        ];
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

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
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
 *                 totalRevenue:
 *                   type: number
 *                 totalBookings:
 *                   type: integer
 */
router.get("/sales/total", async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $match: { status: "confirmed" },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalRevenue: result[0]?.totalRevenue || 0,
      totalBookings: result[0]?.totalBookings || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});//ok

/**
 * @swagger
 * /api/admin/trip-approvals/{id}/approve:
 *   post:
 *     summary: Approve a trip schedule
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TripApproval ID
 *     responses:
 *       200:
 *         description: Trip approved and published
 *       404:
 *         description: Approval request not found
 */
router.post("/trip-approvals/:id/approve", async (req, res) => {
  try {
    const approval = await TripApproval.findById(req.params.id);

    if (!approval) return res.status(404).json({ message: "Approval request not found" });

    approval.status = "approved";
    approval.admin = req.user._id;
    await approval.save();

    await TripSchedule.findByIdAndUpdate(approval.tripSchedule, { isPublic: true });

    res.json({ message: "Trip approved and published" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/trip-approvals/{id}/reject:
 *   post:
 *     summary: Reject a trip schedule
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TripApproval ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Nội dung không phù hợp với quy định"
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Trip rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reason:
 *                   type: string
 *       404:
 *         description: Approval request not found
 */
router.post("/trip-approvals/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    
    const approval = await TripApproval.findById(req.params.id);
    
    if (!approval) return res.status(404).json({ message: "Approval request not found" });

    approval.status = "rejected";
    approval.admin = req.user._id;
    approval.reason = reason;
    await approval.save();

    await TripSchedule.findByIdAndUpdate(approval.tripSchedule, { isPublic: false });

    res.json({ message: "Trip rejected", reason });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
 *       200:
 *         description: Review hidden
 */
router.put("/reviews/:id/hide", async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { status: "hidden" });
    res.json({ message: "Review hidden" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});//ok

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
 *       200:
 *         description: Review visible again
 */
router.put("/reviews/:id/show", async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { status: "visible" });
    res.json({ message: "Review visible" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
//ok


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
 *       200:
 *         description: Report resolved
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
//ok


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
 *       200:
 *         description: User account locked
 *       404:
 *         description: User not found
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
});//ok nhung model User chua co isLocked

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
 *       200:
 *         description: User account unlocked
 *       404:
 *         description: User not found
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
//same lock

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Admin route working!" });
});

export default router;