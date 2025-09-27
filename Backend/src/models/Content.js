import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
    body: {
        type: String,
        required: true
    },
    extraInfo: {
        type: String
    },
}, {
    timestamps: true
});

const Content = mongoose.models.Content || mongoose.model('Content', contentSchema);
export default Content;
