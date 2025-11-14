// src/index.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { Server } from 'socket.io';
import http from 'http';
import dotenv from "dotenv";
import session from 'express-session';
import methodOverride from 'method-override';

// Config imports
import { connectToMongoDB } from "./lib/db.js";
import sessionConfig from './config/sessionConfig.js';
import { jwtPassport } from './config/jwtConfig.js';

// Routes imports
import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import placesRoutes from "./routes/placesRoutes.js";
import routingRoutes from "./routes/routingRoutes.js";
import tripScheduleRoutes from "./routes/tripScheduleRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoute.js";
import postRoutes from './routes/postRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js'; // Thêm route conversation
import reportRoutes from "./routes/reportRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import adminReviewRouter from "./routes/adminReviews.js";

// Models imports (quan trọng cho Socket.IO)
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(session(sessionConfig));
app.use(jwtPassport.initialize());
app.use(express.json());
app.use(cors());

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/AI", aiRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/routing", routingRoutes);
app.use("/api/tripSchedule", tripScheduleRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/posts', postRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/conversation", conversationRoutes); // Route conversation
app.use("/api/reports", reportRoutes);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin/reviews", adminReviewRouter);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // User/Support join conversation room
  socket.on('join_conversation', async ({ conversationId, userId, role }) => {
    try {
      socket.join(conversationId);
      console.log(`${role} ${userId} joined conversation ${conversationId}`);

      // Load 50 tin nhắn gần nhất
      const messages = await Message.find({ conversationId })
        .populate('sender', 'username profileImage')
        .sort({ createdAt: 1 })
        .limit(50);

      socket.emit('message_history', messages);

      // Mark as read khi join
      if (role === 'user') {
        await Conversation.findByIdAndUpdate(conversationId, { unreadCountUser: 0 });
      } else if (role === 'support') {
        await Conversation.findByIdAndUpdate(conversationId, { unreadCountSupport: 0 });
      }
    } catch (error) {
      console.error('Join conversation error:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Gửi tin nhắn
  socket.on('send_message', async (data) => {
    const { conversationId, senderId, senderRole, content } = data;

    try {
      // Lưu tin nhắn vào DB
      const newMessage = await Message.create({
        conversationId,
        sender: senderId,
        senderRole,
        content,
      });

      await newMessage.populate('sender', 'username profileImage');

      // Cập nhật conversation
      const updateData = {
        lastMessage: content,
        lastMessageAt: new Date(),
        status: 'active'
      };

      if (senderRole === 'user') {
        updateData.$inc = { unreadCountSupport: 1 };
      } else {
        updateData.$inc = { unreadCountUser: 1 };
      }

      await Conversation.findByIdAndUpdate(conversationId, updateData);

      // Gửi tin nhắn tới tất cả trong room
      io.to(conversationId).emit('receive_message', newMessage);

      // Thông báo cho support có tin nhắn mới
      if (senderRole === 'user') {
        io.emit('new_user_message', { conversationId });
      }

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    socket.to(conversationId).emit('user_typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`API server is running at http://localhost:${PORT}`);
  console.log(`Swagger UI is available at http://localhost:${PORT}/api-docs`);
  console.log(`Socket.IO server is running on the same port`);
});
