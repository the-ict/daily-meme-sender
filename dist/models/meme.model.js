import mongoose from "mongoose";
const reactionSchema = new mongoose.Schema({
    type: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
});
const schema = new mongoose.Schema({
    image: String,
    caption: {
        type: String,
        required: false,
    },
    views: Number,
    author: {
        type: Number,
        required: true,
    },
    reactions: [reactionSchema],
    up: {
        type: [String],
        default: [],
    },
    down: {
        type: [String],
        default: [],
    },
});
export default mongoose.model("Meme", schema);
//# sourceMappingURL=meme.model.js.map