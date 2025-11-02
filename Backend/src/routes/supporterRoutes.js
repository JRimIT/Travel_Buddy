// routes/supporterRoutes.js
import express from "express";
import TripSchedule from "../models/TripSchedule.js";
import { verifySupporter } from "../config/jwtConfig.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Supporter
 *     description: Endpoints for supporter to manage trip bookings
 */

/**
 * @swagger
 * /api/supporter/trips/pending:
 *   get:
 *     tags: [Supporter]
 *     summary: Get pending trips (no supporter yet)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List pending trips
 */
router.get("/trips/pending", verifySupporter, async (req, res) => {
  try {
    const trips = await TripSchedule.find({
      status: "pending",
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
 * /api/supporter/trips/assigned:
 *   get:
 *     tags: [Supporter]
 *     summary: Get trips assigned to current supporter (assigned/processing)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List assigned trips
 */
router.get("/trips/assigned", verifySupporter, async (req, res) => {
  try {
    const userId = req.user.userId;
    const trips = await TripSchedule.find({
      supporter: userId,
      status: { $in: ["assigned", "processing"] },
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
 * /api/supporter/trips/{tripId}:
 *   get:
 *     tags: [Supporter]
 *     summary: Get trip detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip detail
 */
router.get("/trips/:tripId", verifySupporter, async (req, res) => {
  try {
    const trip = await TripSchedule.findById(req.params.tripId)
      .populate("user", "username profileImage")
      .populate("supporter", "username profileImage");
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    // allow view when pending OR supporter is assigned
    if (
      trip.status !== "pending" &&
      (!trip.supporter || trip.supporter.toString() !== req.user.userId)
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this trip" });
    }

    res.json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/supporter/trips/{tripId}/assign:
 *   patch:
 *     tags: [Supporter]
 *     summary: Assign current supporter to a trip (take it)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trip assigned
 */
router.patch("/trips/:tripId/assign", verifySupporter, async (req, res) => {
  try {
    const trip = await TripSchedule.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    if (trip.status !== "pending")
      return res.status(400).json({ message: "Trip already assigned" });

    trip.supporter = req.user.userId;
    trip.status = "assigned";
    await trip.save();

    res.json({ message: "Assigned", trip });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/supporter/trips/{tripId}/task/{taskIndex}/complete:
 *   patch:
 *     tags: [Supporter]
 *     summary: Mark a task as completed with optional bookingInfo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskIndex
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingInfo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task completed
 */
router.patch(
  "/trips/:tripId/task/:taskIndex/complete",
  verifySupporter,
  async (req, res) => {
    try {
      const { tripId, taskIndex } = req.params;
      const { bookingInfo } = req.body;
      const trip = await TripSchedule.findById(tripId);
      if (!trip) return res.status(404).json({ message: "Trip not found" });

      if (!trip.supporter || trip.supporter.toString() !== req.user.userId) {
        return res.status(403).json({ message: "Not your assigned trip" });
      }

      const idx = parseInt(taskIndex, 10);
      if (Number.isNaN(idx) || idx < 0 || idx >= (trip.tasks?.length || 0)) {
        return res.status(400).json({ message: "Invalid task index" });
      }

      trip.tasks[idx].completed = true;
      if (bookingInfo) trip.tasks[idx].bookingInfo = bookingInfo;

      if (trip.status === "assigned") trip.status = "processing";

      const allDone = trip.tasks.every((t) => t.completed);
      if (allDone) trip.status = "done";

      await trip.save();

      res.json({ message: "Task completed", task: trip.tasks[idx], trip });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/supporter/trips/history:
 *   get:
 *     tags: [Supporter]
 *     summary: Get supporter's history of completed trips
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History list
 */
router.get("/trips/history", verifySupporter, async (req, res) => {
  try {
    const userId = req.user.userId;
    const trips = await TripSchedule.find({ supporter: userId, status: "done" })
      .populate("user", "username profileImage")
      .sort({ updatedAt: -1 });
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
