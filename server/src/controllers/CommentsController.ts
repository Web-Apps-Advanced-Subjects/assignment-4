import type { Document, HydratedDocument, QueryWithHelpers, Types } from 'mongoose';

import BaseController from './BaseController';

import { commentModel, type Comment } from '../models';
import type { DeleteMany } from '../types';

type CommentModel = typeof commentModel;

type Filters = {
  postID?: Types.ObjectId;
  userID?: Types.ObjectId;
  lastID?: Types.ObjectId;
  limit?: number;
  notUserID?: Types.ObjectId;
};

class CommentsController extends BaseController<Comment> {
  declare model: CommentModel;
  constructor() {
    super(commentModel);
  }

  async getAll(filters: Filters = {}): Promise<Pick<HydratedDocument<Comment>, '_id'>[]> {
    let query;
    query = this.model.find().sort({ _id: 'desc' }).select({ _id: 1 });

    if (filters.postID !== undefined) {
      query = query.byPostID(filters.postID);
    }

    if (filters.userID !== undefined) {
      query = query.byUserID(filters.userID);
    }

    if (filters.notUserID !== undefined) {
      query = query.notByUserID(filters.notUserID);
    }

    if (filters.lastID !== undefined) {
      query = query.fromLastID(filters.lastID);
    }

    if (filters.limit !== undefined) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async getCount(filters: Filters = {}): Promise<number> {
    let query;
    query = this.model.find();

    if (filters.postID !== undefined) {
      query = query.byPostID(filters.postID);
    }

    if (filters.userID !== undefined) {
      query = query.byUserID(filters.userID);
    }

    return await query.countDocuments();
  }

  async deleteByPostID(postID: Comment['postID']): Promise<DeleteMany> {
    return await this.model.find().byPostID(postID).deleteMany();
  }
}

const commentsController = new CommentsController();

export default commentsController;
