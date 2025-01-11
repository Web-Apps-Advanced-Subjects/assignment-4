import type { Document, HydratedDocument, Types } from 'mongoose';

import BaseController from './BaseController';
import commentsController from './CommentsController';
import likesController from './LikesController';

import { postModel, type Post } from '../models';

type PostModel = typeof postModel;

type Filters = {
  limit?: number;
  lastID?: Types.ObjectId;
  userID?: Types.ObjectId;
};

class PostsController extends BaseController<Post> {
  declare model: PostModel;

  constructor() {
    super(postModel);
  }

  async getAll(filters: Filters = {}): Promise<Pick<HydratedDocument<Post>, '_id'>[]> {
    let query;
    query = this.model.find().sort({ _id: 'desc' }).select({ _id: 1 });

    if (filters.userID !== undefined) {
      query = query.byUserID(filters.userID);
    }

    if (filters.lastID !== undefined) {
      query = query.fromLastID(filters.lastID);
    }

    if (filters.limit !== undefined) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async delete(id: Post['_id']): Promise<HydratedDocument<Post> | null> {
    await commentsController.deleteByPostID(id);
    await likesController.deleteByPostID(id);
    return super.delete(id);
  }
}

const postsController = new PostsController();

export default postsController;
