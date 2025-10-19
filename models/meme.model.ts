import mongoose from "mongoose";

interface IReaction {
  type: string;
  count: number;
}

interface IMeme {
  image: string;
  caption?: string;
  views: number;
  author: number | string;
  reactions: IReaction[];
  up: number;
  down: number;
}

const reactionSchema = new mongoose.Schema<IReaction>({
  type: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
});

const schema = new mongoose.Schema<IMeme>({
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
  up: Number,
  down: Number,
});

export default mongoose.model("Meme", schema);
