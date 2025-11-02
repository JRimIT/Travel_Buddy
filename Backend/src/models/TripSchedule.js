import mongoose from "mongoose";

const TripScheduleSchema = new mongoose.Schema({
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

  image: { type: String, required: true },
  hotelDefault: Object,
  flightTicket: Object,
  isPublic: { type: Boolean, default: false },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  status: {
    type: String,
    enum: ["pending", "assigned", "processing", "done"],
    default: "pending",
  },

  supporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  tasks: [
    {
      name: { type: String, required: true },
      completed: { type: Boolean, default: false },
      bookingInfo: { type: String, default: "" },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

// ✅ Auto-generate tasks
TripScheduleSchema.pre("save", function (next) {
  if (this.isNew && (!this.tasks || this.tasks.length === 0)) {
    this.tasks = [];

    if (this.flightTicket) this.tasks.push({ name: "Book flight" });
    if (this.hotelDefault) this.tasks.push({ name: "Book hotel" });

    this.days?.forEach((day) =>
      day.activities?.forEach((act) =>
        this.tasks.push({ name: `Book activity: ${act.name}` })
      )
    );
  }

  next();
});

export default mongoose.models.TripSchedule ||
  mongoose.model("TripSchedule", TripScheduleSchema);
