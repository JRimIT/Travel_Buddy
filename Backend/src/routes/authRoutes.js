// routes/authRoutes.js
import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";

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
 *             password: password123
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

// router.post("/favorite/:bookId", protectRoute, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
//     const { bookId } = req.params;
//     if (!user.favorites.includes(bookId)) {
//       user.favorites.push(bookId);
//       await user.save();
//     }
//     res.json({ message: "Đã thêm vào yêu thích" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// router.delete("/favorite/:bookId", protectRoute, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
//     const { bookId } = req.params;
//     user.favorites = user.favorites.filter((id) => id.toString() !== bookId);
//     await user.save();
//     res.json({ message: "Đã bỏ khỏi yêu thích" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// router.get("/favorites", protectRoute, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).populate({
//       path: "favorites",
//       populate: { path: "user", select: "username profileImage" },
//     });
//     res.json(user.favorites);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

export default router;