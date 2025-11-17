import express from "express";
import TripSchedule from "../models/TripSchedule.js";
import { verifySupporter, verifyUser } from "../config/jwtConfig.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Supporter
 *     description: Endpoints for supporter to manage trip bookings
 */

/**
 * @swagger
 * /api/supporter/booking_pending:
 *   get:
 *     tags: [Supporter]
 *     summary: Get pending trips (no supporter yet)
 *     description: Returns trips that have bookingStatus "booking_pending" and have not been assigned to any supporter.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                   endDate:
 *                     type: string
 *                   budget:
 *                     type: object
 *                     properties:
 *                       flight:
 *                         type: number
 *                       hotel:
 *                         type: number
 *                       fun:
 *                         type: number
 *                   user:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 */
router.get("/booking_pending", verifySupporter, async (req, res) => {
  try {
    const trips = await TripSchedule.find({
      bookingStatus: "booking_pending",
      supporter: null,
    })
      .populate("user", "username profileImage")
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/supporter/assigned:
 *   get:
 *     tags: [Supporter]
 *     summary: Get trips assigned to the current supporter
 *     description: Returns trips assigned to the supporter with bookingStatus "booking_assigned".
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                   endDate:
 *                     type: string
 *                   budget:
 *                     type: object
 *                     properties:
 *                       flight:
 *                         type: number
 *                       hotel:
 *                         type: number
 *                       fun:
 *                         type: number
 *                   user:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 */
router.get("/assigned", verifySupporter, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const supporterId = req.user.userId;
    console.log("USER ID", userId);

    const trips = await TripSchedule.find({
      supporter: supporterId,
      bookingStatus: "booking_assigned",
    })
      .populate("user", "_id username profileImage email")
      .sort({ updatedAt: -1 });

    console.log("TRIPS asigned", trips);
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/supporter/history:
 *   get:
 *     tags: [Supporter]
 *     summary: Get supporter's history of completed trips
 *     description: Returns trips that the supporter has completed (bookingStatus "booking_done").
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                   endDate:
 *                     type: string
 *                   budget:
 *                     type: object
 *                     properties:
 *                       flight:
 *                         type: number
 *                       hotel:
 *                         type: number
 *                       fun:
 *                         type: number
 *                   user:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 */
router.get("/history", verifySupporter, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const trips = await TripSchedule.find({
      supporter: userId,
      bookingStatus: "booking_done",
    })
      .populate("user", "username profileImage")
      .sort({ updatedAt: -1 });
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * tags:
 *   - name: Supporter
 *     description: Supporter management APIs
 */

/**
 * @swagger
 * /api/supporter/assign/{tripId}:
 *   put:
 *     tags: [Supporter]
 *     summary: Assign a booking pending trip to the authenticated supporter
 *     description: Supporter nhận xử lý một trip đang ở trạng thái "booking_pending". Sau khi nhận sẽ đổi trạng thái thành "booking_assigned".
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         schema:
 *           type: string
 *         required: true
 *         description: TripSchedule ID
 *     responses:
 *       200:
 *         description: Trip assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Trip assigned successfully
 *                 trip:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     bookingStatus:
 *                       type: string
 *                       example: booking_assigned
 *                     supporter:
 *                       type: string
 *                       description: ID của supporter nhận trip
 *       401:
 *         description: Unauthorized (Missing or invalid Access Token)
 *       404:
 *         description: Trip not found or already assigned/completed
 *       500:
 *         description: Server error
 */
router.put("/assign/:tripId", verifySupporter, async (req, res) => {
  console.log("Test Asig from token:", req.user);
  try {
    const userId = req.user.userId || req.user._id;

    const updated = await TripSchedule.findOneAndUpdate(
      {
        _id: req.params.tripId,
        bookingStatus: "booking_pending",
        supporter: null, // đảm bảo chưa có supporter
      },
      {
        $set: {
          supporter: userId,
          bookingStatus: "booking_assigned",
        },
      },
      { new: true }
    )
      .populate("user", "username profileImage")
      .populate("supporter", "username profileImage");

    if (!updated) {
      // Bạn có thể trả 409 nếu muốn phân biệt "đã có người nhận"
      return res
        .status(404)
        .json({ message: "Trip not found or already assigned/completed" });
    }

    res.json({ message: "Trip assigned successfully", trip: updated });
  } catch (err) {
    console.error("Assign error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/supporter/complete/{tripId}:
 *   put:
 *     tags: [Supporter]
 *     summary: Mark assigned trip as completed
 *     security:
 *       - bearerAuth: []
 */
router.put("/complete/:tripId", verifySupporter, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const updated = await TripSchedule.findOneAndUpdate(
      {
        _id: req.params.tripId,
        supporter: userId,
        bookingStatus: "booking_assigned",
      },
      {
        bookingStatus: "booking_done",
      },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Trip not found or not assigned to you" });
    }

    res.json({ message: "Trip completed!", trip: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
/**
 * @swagger
 * /api/supporter/stats:
 *   get:
 *     tags: [Supporter]
 *     summary: Get supporter's dashboard stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assigned:
 *                   type: number
 *                 pending:
 *                   type: number
 *                 confirmedToday:
 *                   type: number
 *                 changeRequests:
 *                   type: number
 */
router.get("/stats", verifySupporter, async (req, res) => {
  try {
    const supporterId = req.user.userId || req.user._id;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // assigned trips của support
    const assignedCount = await TripSchedule.countDocuments({
      supporter: supporterId,
      bookingStatus: "booking_assigned",
    });

    // pending trips toàn hệ thống
    const pendingCount = await TripSchedule.countDocuments({
      bookingStatus: "booking_pending",
      supporter: null,
    });

    // confirmed today (trips hoàn thành hôm nay)
    const confirmedTodayCount = await TripSchedule.countDocuments({
      supporter: supporterId,
      bookingStatus: "booking_done",
      updatedAt: {
        $gte: new Date(`${todayStr}T00:00:00.000Z`),
        $lte: new Date(`${todayStr}T23:59:59.999Z`),
      },
    });

    // changeRequests tạm thời = 0
    const changeRequests = 0;

    res.json({
      assigned: assignedCount,
      pending: pendingCount,
      confirmedToday: confirmedTodayCount,
      changeRequests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
