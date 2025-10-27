// src/models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { // <-- Thêm trường này
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Tham chiếu đến model User của bạn
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String, // Link ảnh, sử dụng Cloudinary bạn đã có
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  hashtags: [{ type: String, trim: true }],
}, { timestamps: true });

postSchema.index({ title: 'text', content: 'text', hashtags: 'text' });

const Post = mongoose.model('Post', postSchema);
export default Post;
