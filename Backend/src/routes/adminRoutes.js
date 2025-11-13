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
 * /api/admin/sales/trends:
 *   get:
 *     summary: Get sales trends over time (daily/weekly/monthly/yearly)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [day, week, month, year], default: month }
 *         description: Group data by time unit
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date, example: "2025-01-01" }
 *         description: Start date (inclusive)
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date, example: "2025-12-31" }
 *         description: End date (inclusive)
 *     responses:
 *       200:
 *         description: Sales trends data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period: { type: string, example: "2025-01" }
 *                       totalRevenue: { type: number }
 *                       bookingCount: { type: integer }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalRevenue: { type: number }
 *                     totalBookings: { type: integer }
 *                     growthPercentage: { type: number }  # So với kỳ trước
 */
router.get("/sales/trends", async (req, res) => {
  try {
    const { groupBy = "month", fromDate, toDate } = req.query;
    let match = { status: "confirmed" };
    if (fromDate) match.bookingDate = { ...match.bookingDate, $gte: new Date(fromDate) };
    if (toDate) match.bookingDate = { ...match.bookingDate, $lte: new Date(toDate) };

    let groupId;
    switch (groupBy) {
      case "day": groupId = { $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" } }; break;
      case "week": groupId = { $dateToString: { format: "%Y-W%V", date: "$bookingDate" } }; break;
      case "year": groupId = { $dateToString: { format: "%Y", date: "$bookingDate" } }; break;
      default: groupId = { $dateToString: { format: "%Y-%m", date: "$bookingDate" } }; // month
    }

    const trends = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupId,
          totalRevenue: { $sum: "$amount" },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { period: "$_id", totalRevenue: 1, bookingCount: 1, _id: 0 } }
    ]);

    const totalRevenue = trends.reduce((sum, t) => sum + t.totalRevenue, 0);
    const totalBookings = trends.reduce((sum, t) => sum + t.bookingCount, 0);
    const growth = trends.length > 1 ? ((trends[trends.length - 1].totalRevenue - trends[trends.length - 2].totalRevenue) / trends[trends.length - 2].totalRevenue * 100) : 0;

    res.json({ trends, summary: { totalRevenue, totalBookings, growthPercentage: growth } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});//ok

/**
 * @swagger
 * /api/admin/users/stats:
 *   get:
 *     summary: Get user statistics and trends
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, enum: [month, year], default: month }
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: User stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 growthTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period: { type: string }
 *                       newUsers: { type: integer }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalUsers: { type: integer }
 *                     activeUsers: { type: integer }  # Có activity gần đây
 *                     lockedUsers: { type: integer }
 *                 topUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username: { type: string }
 *                       tripCount: { type: integer }
 *                       bookingCount: { type: integer }
 */
router.get("/users/stats", async (req, res) => {
  try {
    const { groupBy = "month", fromDate, toDate } = req.query;
    let match = {};
    if (fromDate) match.createdAt = { ...match.createdAt, $gte: new Date(fromDate) };
    if (toDate) match.createdAt = { ...match.createdAt, $lte: new Date(toDate) };

    const groupId = groupBy === "year" ? { $dateToString: { format: "%Y", date: "$createdAt" } } : { $dateToString: { format: "%Y-%m", date: "$createdAt" } };

    const growthTrends = await User.aggregate([
      { $match: match },
      { $group: { _id: groupId, newUsers: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { period: "$_id", newUsers: 1, _id: 0 } }
    ]);

    const [totalUsers, lockedUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isLocked: true })
    ]);

    // Active users: giả sử có field lastLogin hoặc dùng trips/bookings gần đây
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }); // 30 ngày

    // Top users: aggregate từ TripSchedule và Booking
    const topUsers = await User.aggregate([
      { $lookup: { from: "tripschedules", localField: "_id", foreignField: "user", as: "trips" } },
      { $lookup: { from: "bookings", localField: "_id", foreignField: "user", as: "bookings" } },
      {
        $project: {
          username: 1,
          tripCount: { $size: "$trips" },
          bookingCount: { $size: "$bookings" }
        }
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      growthTrends,
      summary: { totalUsers, activeUsers, lockedUsers },
      topUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});//ok

/**
 * @swagger
 * /api/admin/trips-statistics:
 *   get:
 *     summary: Get trip statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Trip stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status: { type: string }
 *                       count: { type: integer }
 *                 rejectionReasons:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       reason: { type: string }
 *                       count: { type: integer }
 *                 creationTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period: { type: string }
 *                       count: { type: integer }
 */
router.get("/trips-statistics", async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    let match = {};
    if (fromDate) match.createdAt = { ...match.createdAt, $gte: new Date(fromDate) };
    if (toDate) match.createdAt = { ...match.createdAt, $lte: new Date(toDate) };

    const [statusDistribution, rejectionReasons, creationTrends] = await Promise.all([
      TripSchedule.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } }
      ]),
      TripSchedule.aggregate([
        { $match: { ...match, status: "rejected" } },
        { $group: { _id: "$rejectReason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { reason: "$_id", count: 1, _id: 0 } }
      ]),
      TripSchedule.aggregate([
        { $match: match },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { period: "$_id", count: 1, _id: 0 } }
      ])
    ]);

    res.json({ statusDistribution, rejectionReasons, creationTrends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/admin/reviews/stats:
 *   get:
 *     summary: Get review statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: targetId
 *         schema: { type: string }
 *         description: Filter by place/trip ID
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Review stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratingDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rating: { type: integer }
 *                       count: { type: integer }
 *                 averageRating: { type: number }
 *                 reviewTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period: { type: string }
 *                       count: { type: integer }
 *                       avgRating: { type: number }
 */
router.get("/reviews/stats", async (req, res) => {
  try {
    const { targetId, fromDate, toDate } = req.query;
    let match = { status: "visible" };
    if (targetId) match.targetId = targetId;
    if (fromDate) match.createdAt = { ...match.createdAt, $gte: new Date(fromDate) };
    if (toDate) match.createdAt = { ...match.createdAt, $lte: new Date(toDate) };

    const [ratingDistribution, reviewTrends, overallAvg] = await Promise.all([
      Review.aggregate([
        { $match: match },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $project: { rating: "$_id", count: 1, _id: 0 } }
      ]),
      Review.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            avgRating: { $avg: "$rating" }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { period: "$_id", count: 1, avgRating: 1, _id: 0 } }
      ]),
      Review.aggregate([{ $match: match }, { $group: { _id: null, avg: { $avg: "$rating" } } }])
    ]);

    res.json({
      ratingDistribution,
      reviewTrends,
      averageRating: overallAvg[0]?.avg || 0
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

    // CHỈ LẤY BÁO CÁO VỀ TRIPSCHEDULE
    const filter = { targetType: "TripSchedule" };
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate("reporter", "username profileImage")
      .sort({ createdAt: -1 });

    // Populate chi tiết TripSchedule
    const populatedReports = await Promise.all(
      reports.map(async (report) => {
        let target = null;

        if (report.targetId) {
          target = await TripSchedule.findById(report.targetId)
            .select("title image isPublic user")
            .populate("user", "username profileImage");
        }

        return {
          _id: report._id,
          reason: report.reason,
          description: report.description,
          status: report.status,
          createdAt: report.createdAt,
          reporter: {
            _id: report.reporter._id,
            username: report.reporter.username,
            profileImage: report.reporter.profileImage,
          },
          target: target
            ? {
                _id: target._id,
                title: target.title,
                image: target.image,
                isPublic: target.isPublic,
                owner: target.user
                  ? {
                      _id: target.user._id,
                      username: target.user.username,
                      profileImage: target.user.profileImage,
                    }
                  : null,
              }
            : null,
        };
      })
    );

    res.json(populatedReports);
  } catch (error) {
    console.error("Error fetching trip reports:", error);
    res.status(500).json({ message: "Lỗi server" });
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