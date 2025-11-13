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
    supporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
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
  },
  {
    timestamps: true,
  }
);

// Không tạo lại khi hot reload dev mode Next/MongoDB
export default mongoose.models.TripSchedule ||
  mongoose.model("TripSchedule", TripScheduleSchema);
