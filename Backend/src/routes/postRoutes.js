// src/routes/postRoutes.js
import { Router } from 'express';
const router = Router();

import User from '../models/User.js';
import Post from '../models/Post.js'; // Thêm .js
import Comment from '../models/Comment.js'; // Thêm .js
import authMiddleware from '../middleware/auth.middleware.js';
import protectRoute from '../middleware/auth.middleware.js';  // Giả sử bạn có middleware này để xác thực user

const extractHashtags = (text) => {
  if (!text) return [];
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  return matches ? [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))] : [];
};

// Helper function để populate đệ quy các replies
const populateReplies = async (comments) => {
    for (const comment of comments) {
        if (comment.replies && comment.replies.length > 0) {
            const populatedReplies = await Comment.find({ '_id': { $in: comment.replies } })
                .populate('user', 'username profileImage');
            
            comment.replies = await populateReplies(populatedReplies);
        }
    }
    return comments;
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

router.get('/:id/comments', authMiddleware, async (req, res) => {
    try {
        let comments = await Comment.find({ post: req.params.id, parent: null })
            .populate('user', 'username profileImage')
            .sort({ createdAt: 'desc' });
            
        comments = await populateReplies(comments);
        
        res.json(comments);
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

router.post('/:id/save', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user.id);
    
    // Kiểm tra xem bài viết đã được lưu chưa
    const postIndex = user.savedPosts.indexOf(post._id);

    if (postIndex > -1) {
      // Nếu đã lưu -> Bỏ lưu (xóa khỏi mảng)
      user.savedPosts.splice(postIndex, 1);
      res.json({ message: 'Post unsaved successfully', saved: false });
    } else {
      // Nếu chưa lưu -> Lưu lại (thêm vào mảng)
      user.savedPosts.push(post._id);
      res.json({ message: 'Post saved successfully', saved: true });
    }

    await user.save();

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/me', protectRoute, async (req, res) => {
    try {
        const userId = req.user._id;
        const posts = await Post.find({ user: userId })
            .populate('user', 'username profileImage')
            .sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching user's posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get('/saved', protectRoute, async (req, res) => {
    try {
        // 1. Lấy ID người dùng từ token đã được giải mã
        const userId = req.user._id;

        // 2. Tìm người dùng trong DB để lấy danh sách ID các bài viết đã lưu
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 3. Lấy toàn bộ thông tin của các bài viết dựa trên danh sách ID đã lưu
        const savedPosts = await Post.find({
            '_id': { $in: user.savedPosts }
        })
        .populate('user', 'username profileImage') // Lấy thông tin người đăng bài
        .sort({ createdAt: -1 }); // Sắp xếp bài mới nhất lên đầu

        res.status(200).json(savedPosts);

    } catch (error) {
        console.error("Error fetching saved posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/:id', protectRoute, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('user', 'username profileImage') // Lấy thông tin người đăng bài
            .populate({
                path: 'comments', // Cấp 1: Bình luận gốc
                options: { sort: { createdAt: -1 } },
                populate: [
                    {
                        path: 'user', // Thông tin người bình luận cấp 1
                        select: 'username profileImage'
                    },
                    {
                        path: 'replies', // Cấp 2: Trả lời của bình luận cấp 1
                        options: { sort: { createdAt: 1 } },
                        populate: {
                            path: 'user', // Thông tin người trả lời cấp 2
                            select: 'username profileImage',
                            // Nếu muốn hỗ trợ thêm cấp 3, 4, bạn có thể lồng thêm populate ở đây
                            // Tuy nhiên, 2-3 cấp thường là đủ cho hầu hết ứng dụng.
                        }
                    }
                ]
            });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json(post);

    } catch (error) {
        console.error("Error fetching post details:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.post('/:postId/comments', protectRoute, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, parentId } = req.body;
    const userId = req.user._id;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const newComment = new Comment({
      text: text.trim(),
      user: userId,
      post: postId,
      parent: parentId || null,
    });
    await newComment.save();

    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, { $push: { replies: newComment._id } });
    } else {
      await Post.findByIdAndUpdate(postId, { $push: { comments: newComment._id } });
    }

    // ✅ Dù là comment gốc hay reply thì đều tăng tổng commentCount
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populatedComment = await Comment.findById(newComment._id)
      .populate("user", "username profileImage");

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
