// src/routes/postRoutes.js
import { Router } from 'express';
const router = Router();

import Post from '../models/Post.js'; // Thêm .js
import Comment from '../models/Comment.js'; // Thêm .js
import authMiddleware from '../middleware/auth.middleware.js'; // Giả sử bạn có middleware này để xác thực user

// Lấy tất cả bài đăng (cho feed)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username profileImage') // <-- THÊM DÒNG NÀY
      .sort({ createdAt: 'desc' });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tạo bài đăng mới
router.post('/', authMiddleware, async (req, res) => {
    const { title, content, imageUrl } = req.body; // <-- Nhận thêm title

    const post = new Post({
    title, // <-- Thêm title vào post mới
    content,
    imageUrl,
    user: req.user.id,
    });
  try {
    const newPost = await post.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Like/Unlike một bài đăng
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId = req.user.id;
        const likedIndex = post.likes.indexOf(userId);

        if (likedIndex > -1) {
            // Đã like -> unlike
            post.likes.splice(likedIndex, 1);
        } else {
            // Chưa like -> like
            post.likes.push(userId);
        }
        
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Thêm bình luận
router.post('/:id/comments', authMiddleware, async (req, res) => {
  const { text } = req.body;
  const comment = new Comment({
    text,
    post: req.params.id,
    user: req.user.id,
  });

  try {
    const comment = new Comment({
      text: req.body.text.trim(),
      post: req.params.id,
      user: req.user.id,
    });
    const newComment = await comment.save();

    await Post.findByIdAndUpdate(req.params.id, { $push: { comments: newComment._id } });
    
    const populatedComment = await Comment.findById(newComment._id).populate('user', 'username profileImage');

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    // Tìm tất cả comment có `post` field khớp với ID của bài đăng
    const comments = await Comment.find({ post: req.params.id })
      .populate('user', 'username profileImage') // Lấy thông tin người bình luận
      .sort({ createdAt: 'desc' }); // Sắp xếp mới nhất lên đầu
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// THÊM MỘT BÌNH LUẬN MỚI
router.post('/:id/comments', authMiddleware, async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ message: 'Comment text cannot be empty' });
  }

  try {
    // 1. Tạo comment mới
    const comment = new Comment({
      text: text.trim(),
      post: req.params.id,
      user: req.user.id, // Lấy từ middleware xác thực
    });
    const newComment = await comment.save();

    // 2. Thêm ID của comment mới vào mảng `comments` của bài đăng
    const post = await Post.findById(req.params.id);
    post.comments.push(newComment._id);
    await post.save();
    
    // 3. Populate thông tin user và trả về comment hoàn chỉnh
    const populatedComment = await newComment.populate('user', 'username profileImage');

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { title, content } = req.body;

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // --- KIỂM TRA QUYỀN SỞ HỮU ---
    // Chỉ chủ nhân của bài viết mới có quyền sửa
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    // Cập nhật các trường được cung cấp
    post.title = title || post.title;
    post.content = content || post.content;

    const updatedPost = await post.save();
    res.json(updatedPost);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
