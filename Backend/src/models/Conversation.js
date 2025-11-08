import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi user chỉ có 1 conversation với support
    },
    supportAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin được assign để support
    },
    lastMessage: {
        type: String
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'pending'],
        default: 'pending'
    },
    unreadCountUser: {
        type: Number,
        default: 0
    },
    unreadCountSupport: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
