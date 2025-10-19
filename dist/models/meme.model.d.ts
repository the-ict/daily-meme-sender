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
    up: number[];
    down: number[];
    score: number;
    mood?: string;
    sent?: boolean;
}
declare const _default: mongoose.Model<IMeme, {}, {}, {}, mongoose.Document<unknown, {}, IMeme, {}, mongoose.DefaultSchemaOptions> & IMeme & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<IMeme, mongoose.Model<IMeme, any, any, any, mongoose.Document<unknown, any, IMeme, any, {}> & IMeme & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, IMeme, mongoose.Document<unknown, {}, mongoose.FlatRecord<IMeme>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<IMeme> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=meme.model.d.ts.map