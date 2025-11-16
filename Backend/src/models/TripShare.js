import mongoose from "mongoose";

const TripShareSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "TripSchedule", required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    // Trip mới được tạo khi người nhận bấm "Chấp nhận"
    acceptedTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TripSchedule",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

TripShareSchema.index({ to: 1, status: 1 });
TripShareSchema.index({ from: 1, status: 1 });

export default mongoose.models.TripShare ||
  mongoose.model("TripShare", TripShareSchema);


