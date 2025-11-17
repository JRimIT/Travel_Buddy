import mongoose from "mongoose";

const PostShareSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

PostShareSchema.index({ to: 1, status: 1 });
PostShareSchema.index({ from: 1, status: 1 });

export default mongoose.models.PostShare ||
  mongoose.model("PostShare", PostShareSchema);

