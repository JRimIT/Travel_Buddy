// src/models/Comment.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  parent: { // ID của bình luận cha (nếu là một trả lời)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  replies: [{ // Mảng các ID của bình luận con
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;