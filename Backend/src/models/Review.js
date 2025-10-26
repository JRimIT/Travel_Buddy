import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', required: true 
    },
    targetType: { 
        type: String, 
        enum: ['TripSchedule', 'Place'], 
        required: true 
    },
    targetId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    rating: { 
        type: Number, 
        min: 1, max: 5 
    },
    comment: String,
    status: { 
        type: String, 
        enum: ['visible', 'hidden'], 
        default: 'visible' },
}, { timestamps: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);