// routes/adminRoutes.js
import express from "express";
import { verifyAdmin } from "../config/jwtConfig.js";
import TripSchedule from "../models/TripSchedule.js";
import TripApproval from "../models/TripApproval.js";
import Place from "../models/Place.js";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Report from "../models/Report.js";

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
 *     TripApproval:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         tripSchedule: { type: string }
 *         status: { type: string, enum: [pending, approved, rejected] }
 *         admin: { type: string }
 *         reason: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     PlaceSummary:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string }
 *         bookingCount: { type: number }
 *         averageRating: { type: number }
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
 *         name: userId
 *         schema: { type: string }
 *         description: Filter by user ID
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
    const { userId, isPublic, page = 1, limit = 10 } = req.query;
    const query = {};
    if (userId) query.user = userId;
    if (isPublic !== undefined) query.isPublic = isPublic === "true";

    const trips = await TripSchedule.find(query)
      .populate("user", "username email")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await TripSchedule.countDocuments(query);

    res.json({
      trips,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
});

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
 *         schema: { type: string }
 *         description: TripSchedule ID
 *     responses:
 *       200:
 *         description: Trip approved and published
 *       404:
 *         description: Approval request not found
 */
router.post("/trip-approvals/:id/approve", async (req, res) => {
  try {
    const approval = await TripApproval.findOne({
      tripSchedule: req.params.id,
    });
    if (!approval) return res.status(404).json({ message: "Not found" });

    approval.status = "approved";
    approval.admin = req.user._id;
    await approval.save();

    await TripSchedule.findByIdAndUpdate(req.params.id, { isPublic: true });

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
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Trip rejected
 *       404:
 *         description: Approval request not found
 */
router.post("/trip-approvals/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    const approval = await TripApproval.findOne({
      tripSchedule: req.params.id,
    });
    if (!approval) return res.status(404).json({ message: "Not found" });

    approval.status = "rejected";
    approval.admin = req.user._id;
    approval.reason = reason;
    await approval.save();

    res.json({ message: "Trip rejected", reason });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
 */
router.get("/reviews", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reviews = await Review.find(filter)
      .populate("user", "username")
      .populate("targetId")
      .sort({ createdAt: -1 });
    res.json(reviews);
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

router.get("/test", (req, res) => {
  res.json({ message: "Test successful" });
});

export default router;