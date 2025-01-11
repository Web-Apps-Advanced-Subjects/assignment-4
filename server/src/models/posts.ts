import { Schema, Types, model } from 'mongoose';
import type { Model, HydratedDocument, QueryWithHelpers } from 'mongoose';

export type Post = {
  content: string;
  media?: string;
  userID: Types.ObjectId;
  _id: Types.ObjectId;
};

type PostQueryHelpers = {
  byUserID(
    userID: Post['userID'],
  ): QueryWithHelpers<HydratedDocument<Post>[], HydratedDocument<Post>, PostQueryHelpers>;
  fromLastID(
    _id: Post['_id'],
  ): QueryWithHelpers<HydratedDocument<Post>[], HydratedDocument<Post>, PostQueryHelpers>;
};

type PostModel = Model<Post, PostQueryHelpers>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const postSchema = new Schema<Post, PostModel, {}, PostQueryHelpers>({
  content: { type: String, required: true },
  media: { type: String },
  userID: { type: Schema.ObjectId, ref: 'users' },
});

postSchema.query.byUserID = function byUserID(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: QueryWithHelpers<any, HydratedDocument<Post>, PostQueryHelpers>,
  userID: Post['userID'],
) {
  return this.find({ userID });
};

postSchema.query.fromLastID = function fromLastID(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  this: QueryWithHelpers<any, HydratedDocument<Post>, PostQueryHelpers>,
  _id: Post['_id'],
) {
  return this.find({ _id: { $lt: _id } });
};

export default model<Post, PostModel>('posts', postSchema);
