// src/routes/postRoutes.js
import { Router } from 'express';
const router = Router();

import Post from '../models/Post.js'; // Thêm .js
import Comment from '../models/Comment.js'; // Thêm .js
import authMiddleware from '../middleware/auth.middleware.js'; // Giả sử bạn có middleware này để xác thực user

const extractHashtags = (text) => {
  if (!text) return [];
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  return matches ? [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))] : [];
};

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
    if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
    }
    // const post = new Post({
    // title, // <-- Thêm title vào post mới
    // content,
    // imageUrl,
    // hashtags,
    // user: req.user.id,
    // });
  try {
    const hashtags = extractHashtags(content);

    const newPost = new Post({
      title,
      content,
      imageUrl,
      hashtags,
      user: req.user.id,
    });

    const savedPost = await newPost.save();
    
    // Populate thông tin user để trả về cho client, giống như các hàm khác
    const populatedPost = await Post.findById(savedPost._id).populate('user', 'username profileImage');
    
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error while creating post', details: error.message });
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
    if (content) {
    post.content = content;
    post.hashtags = extractHashtags(content); // <-- Cập nhật lại hashtags
    }

    const updatedPost = await post.save();
    res.json(updatedPost);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/search', authMiddleware, async (req, res) => {
  let searchQuery = req.query.q ? req.query.q.toString() : '';

  if (!searchQuery) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  // --- CẢI TIẾN LOGIC ---
  // Nếu người dùng tìm kiếm '#danang', ta chỉ nên tìm 'danang'
  if (searchQuery.startsWith('#')) {
    searchQuery = searchQuery.substring(1);
  }

  try {
    const posts = await Post.find(
      { $text: { $search: searchQuery } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .populate('user', 'username profileImage');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // --- KIỂM TRA QUYỀN SỞ HỮU ---
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    // --- XÓA BÀI VIẾT VÀ DỌN DẸP ---
    // 1. Xóa tất cả các bình luận thuộc về bài viết này
    await Comment.deleteMany({ post: req.params.id });

    // 2. Xóa chính bài viết đó
    await post.deleteOne(); // Hoặc post.remove() tùy phiên bản Mongoose

    res.json({ message: 'Post removed successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
