import express from 'express';
import { Types, type HydratedDocument } from 'mongoose';

import { commentsController } from '../controllers';
import { authenticate } from '../middleware';
import { type Comment } from '../models';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments API
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: access-token
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PartialComment:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: The comment text content
 *       example:
 *         content: 'This post is awesome'
 *     Comment:
 *       allOf:
 *       - $ref: '#/components/schemas/PartialComment'
 *       - type: object
 *         required:
 *           - postID
 *         properties:
 *           postID:
 *             type: string
 *             description: The comment post id
 *         example:
 *           postID: '6777cbe51ead7054a6a78d74'
 *       required:
 *         - content
 *     DBComment:
 *       allOf:
 *       - $ref: '#/components/schemas/Comment'
 *       - type: object
 *         required:
 *           - userID
 *           - _id
 *         properties:
 *           userID:
 *             type: string
 *             description: The comment user id
 *           _id:
 *             type: string
 *             description: The comment id
 *         example:
 *           userID: '6777cbe51ead7054a6a78d74'
 *           _id: '6777cbe51ead7054a6a78d74'
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get comments
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: userID
 *         type: string
 *         description: The userID to filter by if needed
 *       - in: query
 *         name: postID
 *         type: string
 *         description: The postID to filter by if needed
 *       - in: query
 *         name: notUserID
 *         type: string
 *         description: Filter out comments made by that userID
 *       - in: query
 *         name: limit
 *         type: number
 *         description: Limit the amount of results returned back from the server
 *       - in: query
 *         name: lastID
 *         type: string
 *         description: An offset like comment id to start the query from (not included)
 *     responses:
 *       200:
 *         description: the wanted comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DBComment'
 */

router.get('/', async (req, res) => {
  const postID = req.query.postID as unknown as Types.ObjectId | undefined;
  const userID = req.query.userID as unknown as Types.ObjectId | undefined;
  const notUserID = req.query.notUserID as unknown as Types.ObjectId | undefined;
  const limit = req.query.limit as unknown as number | undefined;
  const lastID = req.query.lastID as unknown as Types.ObjectId | undefined;
  const comments = await commentsController.getAll({ userID, postID, lastID, limit, notUserID });

  res.status(200).json({ comments });
});

/**
 * @swagger
 * /comments/count:
 *   get:
 *     summary: Get comments count
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: userID
 *         type: string
 *         description: The userID to count comments by
 *       - in: query
 *         name: postID
 *         type: string
 *         description: The postID to count comments by
 *     responses:
 *       200:
 *         description: the comments count
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 required:
 *                   - count
 *                 properties:
 *                   count:
 *                     type: number
 *                     description: the comment count
 *                 example:
 *                   count: 47
 */

router.get('/count', async (req, res) => {
  const postID = req.query.postID as unknown as Types.ObjectId | undefined;
  const userID = req.query.userID as unknown as Types.ObjectId | undefined;
  let count = await commentsController.getCount({ postID, userID });

  res.status(200).json({ count });
});

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get posts
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: The id of the comment to fetch
 *     responses:
 *       200:
 *         description: the matching comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBComment'
 *       404:
 *         description: No matching comment found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.get('/:id', async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;
  const comment = await commentsController.findById(id);

  if (comment !== null) {
    res.status(200).send(comment);
  } else {
    res.status(404).send('not found');
  }
});

/**
 * @swagger
 * /comment:
 *   post:
 *     summary: Create new comment
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: The new post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBComment'
 *       400:
 *         description: Missing arguments
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       403:
 *         description: Authentication failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.post('/', authenticate, async (req, res) => {
  const { content, postID } = req.body;

  if (content === undefined || postID === undefined) {
    res.status(400).send('Missing Arguments');
    return;
  }

  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const comment = await commentsController.create({ content, postID, userID: req.user._id });

  res.status(201).send(comment);
});

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update comment
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: The id of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PartialComment'
 *     responses:
 *       200:
 *         description: The old updated comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBComment'
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       403:
 *         description: Authentication failed or not comment owner
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.put('/:id', authenticate, async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;
  const { content } = req.body;

  let comment = await commentsController.findById(id);

  if (comment === null) {
    res.sendStatus(404);
    return;
  }

  // @ts-expect-error "user" was patched to the req object from the auth middleware
  if (comment.userID.toString() !== req.user._id) {
    res.sendStatus(403);
    return;
  }

  const commentParams: Partial<Comment> = {};

  if (content !== undefined) {
    commentParams['content'] = content;
  }

  comment = await commentsController.update(id, commentParams);

  res.status(200).send(comment);
});

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete comment by id
 *     tags: [Comments]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: The id of the comment to delete
 *     responses:
 *       200:
 *         description: The deleted comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBComment'
 *       401:
 *         description: Not authenticated
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       403:
 *         description: Authentication failed or not comment owner
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: No matching comment was found to delete
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.delete('/:id', authenticate, async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;

  let post = await commentsController.findById(id);

  if (post === null) {
    res.sendStatus(404);
    return;
  }

  // @ts-expect-error "user" was patched to the req object from the auth middleware
  if (post.userID.toString() !== req.user._id) {
    res.sendStatus(403);
    return;
  }

  post = await commentsController.delete(id);

  res.status(200).send(post);
});

export default router;
