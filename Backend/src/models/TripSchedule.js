import mongoose from "mongoose";

const TripSchedule = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    description: String,
    budget: {
        flight: Number,
        hotel: Number,
        fun: Number,
    },

    days: [{
        day: Number,
        date: String || undefined,
        activities: [{
            time: String,
            name: String,
            cost: Number,
            place: Object
        }],

    }],
    image: {
        type: String,
        required: true
    },
    hotelDefault: Object,
    flightTicket: Object,
    isPublic: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending_review', 'approved', 'rejected'],
        default: 'pending_review'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    rejectReason: String,
})

export default mongoose.models.TripSchedule || mongoose.model('TripSchedule', TripSchedule);