
import TripSchedule from "../models/TripSchedule.js";
import Place from "../models/Place.js";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Report from "../models/Report.js";
import User from "../models/User.js";

// Trip APIs
export const getTrips = async (req, res) => {
    try {
        const { search, isPublic, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        let query = {};
        if (isPublic !== undefined) query.isPublic = isPublic === "true";
        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            const users = await User.find({ $or: [{ username: regex }, { email: regex }] }).select("_id");
            const userIds = users.map(u => u._id);
            query.$or = [{ title: regex }, { user: { $in: userIds } }];
        }
        const [trips, total] = await Promise.all([
            TripSchedule.find(query).populate("user", "username email").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            TripSchedule.countDocuments(query)
        ]);
        res.json({ trips, total, page: +page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error("Search trips error:", error);
        res.status(500).json({ message: "Search failed", error: error.message });
    }
};

export const getTripById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            return res.status(400).json({
                message: "Invalid trip ID format",
                received: id,
                expected: "24-character hex string (ObjectId)"
            });
        }
        const trip = await TripSchedule.findById(id)
            .populate("user", "username email phone")
            .populate("reviewedBy", "username");
        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }
        res.json(trip);
    } catch (error) {
        console.error("Get trip detail error:", error);
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid ID format",
                error: error.message
            });
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTripsPending = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (page - 1) * limit;
        let query = {
            $or: [
                { status: "pending_review" },
                { status: { $exists: false }, isPublic: false }
            ]
        };
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
};

export const approveTrip = async (req, res) => {
    try {
        const trip = await TripSchedule.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: "Trip not found" });
        const isPending = trip.status === "pending_review" || (!trip.status && trip.isPublic === false);
        if (!isPending) {
            return res.status(400).json({
                message: "Trip is not pending review",
                currentStatus: trip.status,
                isPublic: trip.isPublic
            });
        }
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
};

export const rejectTrip = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason?.trim()) return res.status(400).json({ message: "Reason is required" });
        const trip = await TripSchedule.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: "Trip not found" });
        const isPending = trip.status === "pending_review" || (!trip.status && trip.isPublic === false);
        if (!isPending) {
            return res.status(400).json({
                message: "Trip is not pending review",
                currentStatus: trip.status,
                isPublic: trip.isPublic
            });
        }
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
};

export const getTripsStatistics = async (req, res) => {
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
};

// Review APIs
export const getReviews = async (req, res) => {
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
};

export const hideReview = async (req, res) => {
    try {
        await Review.findByIdAndUpdate(req.params.id, { status: "hidden" });
        res.json({ message: "Review hidden" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const showReview = async (req, res) => {
    try {
        await Review.findByIdAndUpdate(req.params.id, { status: "visible" });
        res.json({ message: "Review visible" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReviewsStats = async (req, res) => {
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
};

// Place APIs
export const getTopPlaces = async (req, res) => {
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
};

// Report APIs
export const getReports = async (req, res) => {
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
};

export const resolveReport = async (req, res) => {
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
};

// User APIs
export const getUsers = async (req, res) => {
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
};

export const lockUser = async (req, res) => {
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
};

export const unlockUser = async (req, res) => {
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
};

export const getUserStats = async (req, res) => {
    try {
        const { groupBy = "month", fromDate, toDate } = req.query;
        let match = {};
        if (fromDate) match.createdAt = { ...match.createdAt, $gte: new Date(fromDate) };
        if (toDate) match.createdAt = { ...match.createdAt, $lte: new Date(toDate) };
        const groupId = groupBy === "year"
            ? { $dateToString: { format: "%Y", date: "$createdAt" } }
            : { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
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
        const activeUsers = await User.countDocuments({
            lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });
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
};

// Sales APIs
export const getSalesTrends = async (req, res) => {
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
};

export const getSalesTotal = async (req, res) => {
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
};

// Test route
export const adminTestRoute = (req, res) => {
    res.json({ message: "Admin route working!" });
};
