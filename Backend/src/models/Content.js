import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["text", "image"],
        required: true
    },
    value: {
        type: String, // text hoặc URL ảnh
        required: true  
    },
    extraInfo: {
        type: String
    },
}, { timestamps: true });


const Content = mongoose.models.Content || mongoose.model('Content', contentSchema);
export default Content;
