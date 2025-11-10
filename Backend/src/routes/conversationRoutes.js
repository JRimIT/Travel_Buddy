import express from 'express';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import protectRoute from '../middleware/auth.middleware.js';

const router = express.Router();

// GET: Lấy hoặc tạo conversation cho user ${API_URL}/conversation/user/${user._id}
router.get('/user/:userId', async (req, res) => {
    try {
        let conversation = await Conversation.findOne({ user: req.params.userId })
            .populate('user', 'username profileImage')
            .populate('supportAdmin', 'username profileImage');

        if (!conversation) {
            conversation = await Conversation.create({ user: req.params.userId });
            await conversation.populate('user', 'username profileImage');
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: Lấy tất cả conversations cho support admin
router.get('/support/all', async (req, res) => {
    try {
        const conversations = await Conversation.find()
            .populate('user', 'username profileImage email')
            .populate('supportAdmin', 'username')
            .sort({ lastMessageAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: Lấy tin nhắn của conversation
router.get('/:conversationId/messages', async (req, res) => {
    try {
        const messages = await Message.find({ conversationId: req.params.conversationId })
            .populate('sender', 'username profileImage')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT: Assign support admin
router.put('/:conversationId/assign', async (req, res) => {
    try {
        const { supportAdminId } = req.body;
        const conversation = await Conversation.findByIdAndUpdate(
            req.params.conversationId,
            { supportAdmin: supportAdminId, status: 'active' },
            { new: true }
        );
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT: Resolve conversation
router.put('/:conversationId/resolve', async (req, res) => {
    try {
        const conversation = await Conversation.findByIdAndUpdate(
            req.params.conversationId,
            { status: 'resolved' },
            { new: true }
        );
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
