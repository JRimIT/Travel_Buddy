// src/routes/postRoutes.js
import { Router } from 'express';
const router = Router();

import User from '../models/User.js';
import Post from '../models/Post.js'; // Thêm .js
import Comment from '../models/Comment.js'; // Thêm .js
import PostShare from '../models/PostShare.js';
import authMiddleware from '../middleware/auth.middleware.js';
import protectRoute from '../middleware/auth.middleware.js';  // Giả sử bạn có middleware này để xác thực user
import cloudinary from '../lib/cloudinary.js';

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


// Lấy tất cả bài đăng (cho feed) - chỉ hiển thị public posts
router.get('/', async (req, res) => {
  try {
    // Lấy posts có status = 'public' hoặc không có field status (backward compatibility)
    const posts = await Post.find({
      $or: [
        { status: 'public' },
        { status: { $exists: false } }
      ]
    })
      .populate('user', 'username profileImage')
      .sort({ createdAt: 'desc' })
      .lean(); // Sử dụng lean() để trả về plain JavaScript objects
    
    // Loại bỏ local file URIs (file://) - chỉ giữ lại Cloudinary URLs (http/https)
    const cleanedPosts = posts.map(post => {
      // Tạo object mới để tránh mutate trực tiếp
      const cleanedPost = { ...post };
      if (cleanedPost.imageUrl && !cleanedPost.imageUrl.startsWith('http')) {
        // Nếu là local URI, xóa nó đi
        console.log('Removing local URI:', cleanedPost.imageUrl);
        cleanedPost.imageUrl = '';
      }
      return cleanedPost;
    });
    
    // Debug: Log số lượng posts có local URI đã được clean
    const localUriCount = posts.filter(p => p.imageUrl && !p.imageUrl.startsWith('http')).length;
    if (localUriCount > 0) {
      console.log(`Cleaned ${localUriCount} posts with local URIs`);
    }
    
    res.json(cleanedPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tạo bài đăng mới
router.post('/', authMiddleware, async (req, res) => {
    const { title, content, imageUrl, imageBase64 } = req.body; // Nhận imageBase64 để upload lên Cloudinary
    if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
    }
  try {
    let finalImageUrl = imageUrl || '';
    
    // Nếu có imageBase64, upload lên Cloudinary
    if (imageBase64) {
      try {
        // Cloudinary cần data URI format cho base64 uploads
        // Nếu chưa có prefix, thêm vào
        let uploadData = imageBase64;
        if (!imageBase64.startsWith('data:')) {
          uploadData = `data:image/jpeg;base64,${imageBase64}`;
        }
        
        const uploadResponse = await cloudinary.uploader.upload(uploadData, {
          folder: 'travel-buddy/posts',
          resource_type: 'image'
        });
        finalImageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        // Nếu upload thất bại, trả về lỗi JSON rõ ràng
        return res.status(500).json({ 
          message: 'Failed to upload image to Cloudinary', 
          details: uploadError.message || 'Unknown error',
          error: 'IMAGE_UPLOAD_FAILED'
        });
      }
    } else if (imageUrl && !imageUrl.startsWith('http')) {
      // Nếu imageUrl là local URI (file://), bỏ qua vì không thể truy cập từ máy khác
      finalImageUrl = '';
    }

    const hashtags = extractHashtags(content);

    const newPost = new Post({
      title,
      content,
      imageUrl: finalImageUrl,
      hashtags,
      user: req.user.id,
    });

    const savedPost = await newPost.save();
    
    // Debug: Log saved post với imageUrl
    console.log('Saved post:', {
      id: savedPost._id,
      title: savedPost.title,
      imageUrl: savedPost.imageUrl,
      hasImage: !!savedPost.imageUrl
    });
    
    // Populate thông tin user để trả về cho client, giống như các hàm khác
    const populatedPost = await Post.findById(savedPost._id).populate('user', 'username profileImage');
    
    // Debug: Log populated post
    console.log('Populated post response:', {
      id: populatedPost._id,
      title: populatedPost.title,
      imageUrl: populatedPost.imageUrl,
      hasImage: !!populatedPost.imageUrl
    });
    
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Server error while creating post', details: err.message });
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
    // Chỉ tìm kiếm trong các bài viết public hoặc không có field status
    const posts = await Post.find({
      $and: [
        { $text: { $search: searchQuery } },
        {
          $or: [
            { status: 'public' },
            { status: { $exists: false } }
          ]
        }
      ]
    }, { score: { $meta: "textScore" } })
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
            .sort({ createdAt: -1 })
            .lean();
        
        // Loại bỏ local file URIs (file://) - chỉ giữ lại Cloudinary URLs (http/https)
        const cleanedPosts = posts.map(post => {
            // Tạo object mới để tránh mutate trực tiếp
            const cleanedPost = { ...post };
            if (cleanedPost.imageUrl && !cleanedPost.imageUrl.startsWith('http')) {
                // Nếu là local URI, xóa nó đi
                cleanedPost.imageUrl = '';
            }
            return cleanedPost;
        });
        
        res.status(200).json(cleanedPosts);
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
        .sort({ createdAt: -1 }) // Sắp xếp bài mới nhất lên đầu
        .lean();
        
        // Loại bỏ local file URIs (file://) - chỉ giữ lại Cloudinary URLs (http/https)
        const cleanedPosts = savedPosts.map(post => {
            // Tạo object mới để tránh mutate trực tiếp
            const cleanedPost = { ...post };
            if (cleanedPost.imageUrl && !cleanedPost.imageUrl.startsWith('http')) {
                // Nếu là local URI, xóa nó đi
                cleanedPost.imageUrl = '';
            }
            return cleanedPost;
        });

        res.status(200).json(cleanedPosts);

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

// === CHIA SẺ POST ===

// Gửi lời mời chia sẻ post tới user khác
router.post('/:id/share', protectRoute, async (req, res) => {
  try {
    const postId = req.params.id;
    const { toUserId, toUsername, toEmail } = req.body;

    if (!toUserId && !toUsername && !toEmail) {
      return res.status(400).json({ error: "Thiếu thông tin người nhận" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Không tìm thấy bài viết" });

    if (toUserId && String(toUserId) === String(req.user._id)) {
      return res.status(400).json({ error: "Không thể tự chia sẻ cho chính mình" });
    }

    let toUser = null;
    if (toUserId) {
      toUser = await User.findById(toUserId);
    } else if (toUsername) {
      toUser = await User.findOne({ username: toUsername });
    } else if (toEmail) {
      toUser = await User.findOne({ email: toEmail });
    }

    if (!toUser) return res.status(404).json({ error: "Người nhận không tồn tại" });

    // Nếu đã có invite pending giống hệt thì không tạo thêm
    const existing = await PostShare.findOne({
      post: postId,
      from: req.user._id,
      to: toUser._id,
      status: "pending",
    });
    if (existing) {
      return res.json({ success: true, share: existing, duplicated: true });
    }

    const share = await PostShare.create({
      post: postId,
      from: req.user._id,
      to: toUser._id,
      status: "pending",
    });

    res.json({ success: true, share });
  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ error: "Không thể chia sẻ bài viết" });
  }
});

// Lấy danh sách share gửi tới mình
router.get('/shares/incoming', protectRoute, async (req, res) => {
  try {
    const status = req.query.status || "pending";

    const shares = await PostShare.find({
      to: req.user._id,
      status,
    })
      .populate("post", "title content imageUrl user")
      .populate("from", "username profileImage");

    res.json(shares);
  } catch (error) {
    console.error("Error fetching incoming post shares:", error);
    res.status(500).json({ error: "Không thể lấy danh sách chia sẻ" });
  }
});

// Người nhận chấp nhận chia sẻ
router.post('/shares/:shareId/accept', protectRoute, async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await PostShare.findOne({
      _id: shareId,
      to: req.user._id,
      status: "pending",
    }).populate("post");

    if (!share) {
      return res.status(404).json({ error: "Lời mời chia sẻ không tồn tại hoặc đã xử lý" });
    }

    const post = share.post;
    if (!post) {
      return res.status(404).json({ error: "Bài viết không còn tồn tại" });
    }

    // Thêm post vào danh sách shared posts của user (nếu chưa có)
    const user = await User.findById(req.user._id);
    if (!user.sharedPosts) {
      user.sharedPosts = [];
    }
    if (!user.sharedPosts.includes(post._id)) {
      user.sharedPosts.push(post._id);
      await user.save();
    }

    share.status = "accepted";
    await share.save();

    res.json({ success: true, post });
  } catch (error) {
    console.error("Error accepting post share:", error);
    res.status(500).json({ error: "Không thể chấp nhận chia sẻ" });
  }
});

// Người nhận từ chối chia sẻ
router.post('/shares/:shareId/reject', protectRoute, async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await PostShare.findOne({
      _id: shareId,
      to: req.user._id,
      status: "pending",
    });

    if (!share) {
      return res.status(404).json({ error: "Lời mời chia sẻ không tồn tại hoặc đã xử lý" });
    }

    share.status = "rejected";
    await share.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error rejecting post share:", error);
    res.status(500).json({ error: "Không thể từ chối chia sẻ" });
  }
});

// Lấy danh sách posts đã được chia sẻ và mình đã chấp nhận
router.get('/shared/my', protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.sharedPosts || user.sharedPosts.length === 0) {
      return res.json([]);
    }

    const posts = await Post.find({
      _id: { $in: user.sharedPosts }
    })
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching shared posts:", error);
    res.status(500).json({ error: "Không thể lấy danh sách bài viết được chia sẻ" });
  }
});

// Cập nhật status của bài viết (chỉ chủ bài viết mới được phép)
router.patch('/:id/status', protectRoute, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['public', 'private'].includes(status)) {
      return res.status(400).json({ error: 'Status phải là "public" hoặc "private"' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    // Chỉ chủ bài viết mới được phép thay đổi status
    if (String(post.user) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Bạn không có quyền thay đổi status của bài viết này' });
    }

    post.status = status;
    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    console.error("Error updating post status:", error);
    res.status(500).json({ error: "Không thể cập nhật status" });
  }
});

export default router;
