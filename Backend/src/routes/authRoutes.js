// routes/authRoutes.js
import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";
import OTP from "../models/OTP.js";
import sendEmail from "../services/emailService.js";


dotenv.config();

const router = express.Router();

// Hàm tạo token với role
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "5h" });
};

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and user-related endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The user's unique ID
 *         username:
 *           type: string
 *           description: The user's username
 *         email:
 *           type: string
 *           description: The user's email address
 *         profileImage:
 *           type: string
 *           description: URL to the user's profile image
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: The user's role
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the user was created
 *     Book:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The book's unique ID
 *         title:
 *           type: string
 *           description: The book's title
 *         user:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             profileImage:
 *               type: string
 *           description: The user who created the book
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username for the new user (minimum 3 characters)
 *               email:
 *                 type: string
 *                 description: The email address for the new user
 *               password:
 *                 type: string
 *                 description: The password for the new user (minimum 6 characters)
 *             required:
 *               - username
 *               - email
 *               - password
 *           example:
 *             username: Truong
 *             email: admin@gmail.com
 *             password: password123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *             example:
 *               message: "User registered successfully"
 *               user:
 *                 _id: "68fcff79b101af30c676fffc"
 *                 username: "Truong"
 *                 email: "admin@gmail.com"
 *                 profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Truong"
 *                 role: "admin"
 *                 createdAt: "2025-10-25T16:48:57.375Z"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZjZmY3OWIxMDFhZjMwYzY3NmZmZmMiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjE0MTA5OTUsImV4cCI6MTc2MTQyODk5NX0.xxxxx"
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Email already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Internal server error"
 */
router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    console.log("Registering user:", { email, username, password });

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters long" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    const role = email === "admin@gmail.com" ? "admin" : "user";

    const user = new User({
      username,
      email,
      password,
      profileImage,
      role,
    });

    await user.save();
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email address
 *               password:
 *                 type: string
 *                 description: The user's password
 *             required:
 *               - email
 *               - password
 *           example:
 *             email: admin@gmail.com
 *             password: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *             example:
 *               message: "Login successful"
 *               user:
 *                 _id: "68fcff79b101af30c676fffc"
 *                 username: "Truong"
 *                 email: "admin@gmail.com"
 *                 profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Truong"
 *                 role: "admin"
 *                 createdAt: "2025-10-25T16:48:57.375Z"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZjZmY3OWIxMDFhZjMwYzY3NmZmZmMiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjE0MTA5OTUsImV4cCI6MTc2MTQyODk5NX0.xxxxx"
 *       400:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Invalid email or password"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Internal server error"
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role); // Sửa: truyền user.role trực tiếp
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ✅ API: Gửi OTP qua Email
router.post('/send-email-otp', async (req, res) => {
  try {
    const { email, userId } = req.body;

    if (!email || !userId) {
      return res.status(400).json({ message: 'Thiếu email hoặc userId' });
    }

    // Tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Xóa OTP cũ nếu có
    await OTP.deleteMany({ userId, email });

    // Lưu OTP mới (hết hạn sau 5 phút)
    await OTP.create({
      userId,
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Gửi Email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #3488fa;">Mã xác thực Travel Buddy</h2>
        <p>Xin chào,</p>
        <p>Mã OTP của bạn là:</p>
        <h1 style="color: #ec407a; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
        <p>Mã này có hiệu lực trong <strong>5 phút</strong>.</p>
        <p style="color: #999; font-size: 12px;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
      </div>
    `;

    await sendEmail(email, 'Mã xác thực Travel Buddy', htmlContent);

    res.json({ success: true, message: 'OTP đã được gửi đến email' });
  } catch (error) {
    console.error('Send Email OTP Error:', error);
    res.status(500).json({ success: false, message: 'Không thể gửi OTP' });
  }
});

// ✅ API: Verify OTP Email
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp, userId } = req.body;

    if (!email || !otp || !userId) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Tìm OTP trong database
    const otpRecord = await OTP.findOne({
      userId,
      email,
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
    }

    // Xóa OTP sau khi verify thành công
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ success: true, message: 'Xác thực thành công' });
  } catch (error) {
    console.error('Verify Email OTP Error:', error);
    res.status(500).json({ success: false, message: 'Không thể xác thực OTP' });
  }
});


export default router;