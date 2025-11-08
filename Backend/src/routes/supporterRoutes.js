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
 *     description: Returns trips that have status "booking_pending" and have not been assigned to any supporter.
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
      status: "booking_pending",
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
 *     description: Returns trips assigned to the supporter with status "booking_assigned".
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
    console.log("USER ID", userId);

    const trips = await TripSchedule.find({
      status: "booking_assigned",
    })
      .populate("user", "username profileImage")
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
 *     description: Returns trips that the supporter has completed (status "booking_done").
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
      status: "booking_done",
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
 * /api/supporter/assign/{tripId}:
 *   put:
 *     tags: [Supporter]
 *     summary: Assign supporter to pending trip
 *     security:
 *       - bearerAuth: []
 */
router.put("/assign/:tripId", verifySupporter, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const updated = await TripSchedule.findOneAndUpdate(
      {
        _id: req.params.tripId,
        status: "booking_pending",
      },
      {
        supporter: userId,
        status: "booking_assigned",
      },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Trip not found or not pending anymore" });
    }

    res.json({ message: "Trip assigned successfully", trip: updated });
  } catch (err) {
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
        status: "booking_assigned",
      },
      {
        status: "booking_done",
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

export default router;
