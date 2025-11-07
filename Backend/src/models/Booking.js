import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    tripSchedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TripSchedule'
    }, // Nếu đặt cả lịch trình
    place: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Place'
    }, // Nếu đặt địa điểm cụ thể
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    bookingInfo: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);