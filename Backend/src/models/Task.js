import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    name: String, // e.g: "Đặt vé máy bay"
    completed: { type: Boolean, default: false },
    bookingInfo: { type: String }, // link or note
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
