import express from 'express';
import { Types, type HydratedDocument } from 'mongoose';

import { commentsController, postsController } from '../controllers';
import { authenticate } from '../middleware';
import { type Post } from '../models';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Gemini
 *   description: The Gemini API
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /gemini:
 *   get:
 *     summary: Generate post
 *     tags: [Gemini]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The new user
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

type A = {
  a: string;
  b: number;
};

const f: Pick<A, 'a'>[] = [{ a: '' }];

router.get('/', authenticate, async (req, res) => {
  const id = req.params.id as unknown as Types.ObjectId;
  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const userID = req.user._id;

  const postIDs = await postsController.getAll({ userID, limit: 30 });

  let posts: HydratedDocument<Post>[] = [];

  for (const { _id } of postIDs) {
    const post = await postsController.findById(_id);

    if (post !== null) {
      posts.push(post);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY as string;
  const genAi = new GoogleGenerativeAI(apiKey);
  const model = genAi.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
  };

  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  let prompt =
    'I need you to generate a post for me to publish to a social network like twitter/x. Generate only text.\n';

  prompt += "I\'m using you as a part of an api for an application, so really only give me one raw response with no extra formatting that can be then sent to the end user\n"

  if (posts.length !== 0) {
    prompt += "Here are some examples for previous posts that I've made:\n";

    posts.forEach((post, idx) => {
      prompt += `${idx}. ${post.content}\n`;
    });

    prompt += 'Try to make sure that the new post sounds like my old posts.';
  }

  const result = await chatSession.sendMessage(prompt);

  res.status(200).send(result.response.text());
});

export default router;
