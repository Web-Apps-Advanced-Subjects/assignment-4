import express from 'express';
import { Types } from 'mongoose';

import { likesController } from '../controllers';
import { authenticate } from '../middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: The Likes API
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
 * /likes/{postID}:
 *   get:
 *     summary: Get is user liked post
 *     tags: [Likes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postID
 *         required: true
 *         type: string
 *         description: The id of the post to check
 *     responses:
 *       200:
 *         description: answer to whether the user liked the post
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - liked
 *               properties:
 *                 liked:
 *                   type: boolean
 *                   description: whether the user liked the post
 *               example:
 *                 liked: false
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

router.get('/:postID', authenticate, async (req, res) => {
  const postID = req.params.postID as unknown as Types.ObjectId;
  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const userID = req.user._id;
  try {
    const like = await likesController.findById({ userID, postID });

    res.status(200).json({ liked: like !== null });
  } catch {
    res.sendStatus(500);
  }
});

/**
 * @swagger
 * /likes/count:
 *   get:
 *     summary: Get like count
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postID
 *         required: true
 *         type: string
 *         description: The id of the post to count likes for
 *     responses:
 *       200:
 *         description: the like count
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
 *                     description: the like count
 *                 example:
 *                   count: 47
 */

router.get('/count/:postID', async (req, res) => {
  const postID = req.params.postID as unknown as Types.ObjectId;
  const count = await likesController.getCountByPostID(postID);

  res.status(200).json({ count });
});

/**
 * @swagger
 * /likes/{postID}:
 *   post:
 *     summary: Like a post
 *     tags: [Likes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postID
 *         required: true
 *         type: string
 *         description: The id of the post to like
 *     responses:
 *       201:
 *         description: like created
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
 *       409:
 *         description: Post already liked
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.post('/:postID', authenticate, async (req, res) => {
  const postID = req.params.postID as unknown as Types.ObjectId;
  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const userID = req.user._id;

  if ((await likesController.findById({ userID, postID })) !== null) {
    res.status(409).send('Post Already Liked');
    return;
  }

  const like = await likesController.create({ _id: { userID, postID } });

  res.sendStatus(201);
});

/**
 * @swagger
 * /likes/{postID}:
 *   delete:
 *     summary: Remove a like from a post
 *     tags: [Likes]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postID
 *         required: true
 *         type: string
 *         description: The id of the post to remove a like
 *     responses:
 *       200:
 *         description: like removed
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
 *       404:
 *         description: Could not find like to remove
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.delete('/:postID', authenticate, async (req, res) => {
  const postID = req.params.postID as unknown as Types.ObjectId;
  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const userID = req.user._id;
  const like = await likesController.delete({ userID, postID });

  if (like !== null) {
    res.sendStatus(200);
  } else {
    res.status(404).send('Not Found');
  }
});

export default router;
