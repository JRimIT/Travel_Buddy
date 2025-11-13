// models/TripSchedule.js
import mongoose from "mongoose";

const TripScheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    description: String,
    budget: {
      flight: Number,
      hotel: Number,
      fun: Number,
    },
    days: [
      {
        day: Number,
        date: String,
        activities: [
          {
            time: String,
            name: String,
            cost: Number,
            place: Object,
          },
        ],
      },
    ],
    startDate: String,
    endDate: String,
    hotelDefault: Object,
    flightTicket: Object,
    home: Object,
    image: { type: String, required: true },
    mainTransport: { type: String },
    innerTransport: { type: String },
    fromLocation: { type: String },
    province: { type: String },
    isPublic: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      default: "pending_review",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    rejectReason: String,

    // ✅ Chỉ cần lưu 1 vé duy nhất (tàu hoặc xe)
    ticket: {
      gaDi: String,
      gaDen: String,
      chuyenTau: String,
      nhaXe: String,
      diemDi: String,
      diemDen: String,
      soXe: String,
      loaiXe: String,
      ngayDi: String,
      gioDi: String,
      gioDen: String,
      soGheTrong: Number,
    },
    bookingStatus: {
      type: String,
      enum: [
        "not_booking",
        "booking_pending",
        "booking_assigned",
        "booking_done",
      ],
      default: "not_booking",
    },
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    supporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  }
  ,
  { timestamps: true });

// Index để query nhanh
TripScheduleSchema.index({ isPublic: 1 });
TripScheduleSchema.index({ savedBy: 1 });
TripScheduleSchema.index({ completedBy: 1 });

TripScheduleSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'targetId',
  justOne: false,
  options: {
    match: { targetType: 'TripSchedule', status: 'visible' },
    sort: { createdAt: -1 }
  }
});
TripScheduleSchema.set('toObject', { virtuals: true });
TripScheduleSchema.set('toJSON', { virtuals: true });

export default mongoose.models.TripSchedule ||
  mongoose.model("TripSchedule", TripScheduleSchema);