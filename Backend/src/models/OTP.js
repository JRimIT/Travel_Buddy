import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Tự động xóa sau khi hết hạn
    }
}, { timestamps: true });

otpSchema.index({ userId: 1, email: 1, otp: 1 });

// module.exports = mongoose.model('OTP', otpSchema);

export default mongoose.models.OTP || mongoose.model('OTP', otpSchema);
