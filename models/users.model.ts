import mongoose from "mongoose";

interface IUser {
    telegram_id: number | string;
    username?: string;
    first_name?: string;
    last_name?: string;
    viewed_memes?: mongoose.Types.ObjectId[];
    language?: string;
    createdAt: Date;
}

const schema = new mongoose.Schema<IUser>({
    telegram_id: {
        type: Number,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: false,
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
}, {timestamps: true});

export default mongoose.model("User", schema);