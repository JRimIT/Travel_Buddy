// import mongoose from "mongoose";

// const TripApprovalSchema = new mongoose.Schema({
//     tripSchedule: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'TripSchedule', required: true 
//     },
//     status: { 
//         type: String, 
//         enum: ['pending', 'approved', 'rejected'], 
//         default: 'pending' },
//     admin: { 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'User' 
//     }, // Admin duyệt
//     reason: { 
//         type: String 
//     }, // Lý do từ chối (nếu có)
// }, { timestamps: true });

// export default mongoose.models.TripApproval || mongoose.model('TripApproval', TripApprovalSchema);