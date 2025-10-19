import mongoose from "mongoose";
const schema = new mongoose.Schema({
    telegram_id: {
        type: Number,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    first_name: String,
    last_name: String,
    viewed_memes: {
        type: [mongoose.Schema.Types.ObjectId],
        required: false,
        default: []
    },
    language: {
        type: String,
        required: false,
        default: 'uz'
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    }
}, { timestamps: true });
export default mongoose.model("User", schema);
//# sourceMappingURL=users.model.js.map