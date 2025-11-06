import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    targetType: {
        type: String,
        enum: ['User', 'TripSchedule', 'Review', 'Place'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    description: String,
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    },
}, { timestamps: true });

export default mongoose.models.Report || mongoose.model('Report', ReportSchema);