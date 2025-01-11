import { Schema, Types, model } from 'mongoose';
import type { Model, HydratedDocument, QueryWithHelpers } from 'mongoose';

type CompositeLikeID = {
  userID: Types.ObjectId;
  postID: Types.ObjectId;
};

const CompositeLikeIDSchema = new Schema<CompositeLikeID>(
  {
    userID: { type: Schema.ObjectId, ref: 'users' },
    postID: { type: Schema.ObjectId, ref: 'posts' },
  },
  { _id: false },
);

export type Like = {
  _id: CompositeLikeID;
};

type LikeQueryHelpers = {
  byPostID(
    postID: Like['_id']['postID'],
  ): QueryWithHelpers<HydratedDocument<Like>[], HydratedDocument<Like>, LikeQueryHelpers>;
};

type LikeModel = Model<Like, LikeQueryHelpers>;

const LikeSchema = new Schema<Like, LikeModel, {}, LikeQueryHelpers>({
  _id: CompositeLikeIDSchema,
});

LikeSchema.query.byPostID = function byPostID(
  this: QueryWithHelpers<any, HydratedDocument<Like>, LikeQueryHelpers>,
  postID: Like['_id']['postID'],
) {
  return this.find({ '_id.postID': postID });
};

export default model<Like, LikeModel>('likes', LikeSchema);
