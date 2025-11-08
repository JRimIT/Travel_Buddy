import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Post from './models/Post.js';
import Comment from './models/Comment.js';

// Xác định đường dẫn đến file .env ở thư mục gốc Backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') }); // 👈 load .env ở thư mục cha

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI is missing in your .env file');
  process.exit(1);
}

const updateCommentCounts = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const posts = await Post.find();
    console.log(`📦 Found ${posts.length} posts`);

    for (const post of posts) {
      const count = await Comment.countDocuments({ post: post._id });
      await Post.updateOne(
        { _id: post._id },
        { $set: { commentCount: count } }
      );
      console.log(`📝 Post ${post._id}: updated commentCount = ${count}`);
    }

    console.log('🎉 Done updating all posts');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating comment counts:', err);
    process.exit(1);
  }
};

updateCommentCounts();
