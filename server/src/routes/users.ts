import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { OAuth2Client } from 'google-auth-library';

import { usersController } from '../controllers';
import { authenticate } from '../middleware';
import { type User } from '../models';
import { finished } from 'stream/promises';
import { Readable } from 'stream';

const asyncUnlink = promisify(fs.unlink);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/avatars/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});
const upload = multer({ storage: storage });
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The Users API
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
 * components:
 *   schemas:
 *
 *     Username:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: The user username
 *       example:
 *         username: 'bob'
 *
 *     Password:
 *        type: object
 *        required:
 *          - password
 *        properties:
 *          password:
 *            type: string
 *            description: The user password
 *        example:
 *          password: 'pass'
 *
 *     Avatar:
 *       type: object
 *       properties:
 *         avatar:
 *           type: string
 *           description: The user avatar location on the server
 *       example:
 *         avatar: '/public/avatar/profile.png'
 *
 *     UploadAvatar:
 *       type: object
 *       properties:
 *         avatar:
 *           type: string
 *           format: binary
 *           description: The user avatar picture file
 *       example:
 *         avatar: 'picture.png'
 *
 *     Email:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           description: The user email account
 *       example:
 *         email: 'user@gmail.com'
 *
 *     UserID:
 *       type: object
 *       required:
 *         - _id
 *       properties:
 *         _id:
 *           type: string
 *           description: The user id
 *       example:
 *         _id: '6777cbe51ead7054a6a78d74'
 *
 *     RefreshToken:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: The user generated refresh token
 *       example:
 *         refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV9'
 *
 *     DBUser:
 *       allOf:
 *       - $ref: '#/components/schemas/Username'
 *       - $ref: '#/components/schemas/Email'
 *       - $ref: '#/components/schemas/Avatar'
 *       - $ref: '#/components/schemas/UserID'
 *       - type: object
 *         required:
 *           - _id
 *         properties:
 *           _id:
 *             type: string
 *             description: The user id
 *         example:
 *           _id: '6777cbe51ead7054a6a78d74'
 *       required:
 *         - username
 *         - avatar
 *
 *     Credentials:
 *       allOf:
 *       - $ref: '#/components/schemas/UserID'
 *       - $ref: '#/components/schemas/RefreshToken'
 *       - type: object
 *         required:
 *           - accessToken
 *         properties:
 *           accessToken:
 *             type: string
 *             description: The user generated access token
 *         example:
 *           accessToken: 'eyJfaWQiOiI2Nzc3Y2JlNTFlYWQ3MDU0YTZh'
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: registers a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *             - $ref: '#/components/schemas/Username'
 *             - $ref: '#/components/schemas/Password'
 *             - $ref: '#/components/schemas/Email'
 *             - $ref: '#/components/schemas/UploadAvatar'
 *             required:
 *               - avatar
 *               - username
 *     responses:
 *       201:
 *         description: The new user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBUser'
 *       400:
 *         description: Missing arguments/Bad avatar file format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       409:
 *         description: Username taken
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.post('/register', upload.single('avatar'), async (req, res) => {
  const { username, password, email } = req.body;
  const file = req.file;

  if (
    username === undefined ||
    password === undefined ||
    email === undefined ||
    file === undefined
  ) {
    if (file !== undefined) {
      await asyncUnlink(file.path);
    }

    res.status(400).send('Missing Arguments');
    return;
  }

  if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
    await asyncUnlink(file.path);

    res.status(400).send('File Type Unsupported');
    return;
  }

  try {
    let user = await usersController.findOneByEmail(email);

    if (user !== null) {
      await asyncUnlink(file.path);

      res.status(409).send('Email Taken');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const avatar = file.path.replaceAll(path.sep, path.posix.sep);
    user = await usersController.create({
      username,
      password: hashedPassword,
      email,
      avatar,
      tokens: [],
    });

    res
      .status(201)
      .send({ _id: user._id, username: user.username, avatar: user.avatar, email: user.email });
  } catch (err) {
    await asyncUnlink(file.path);

    throw err;
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: login to existing user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *             - $ref: '#/components/schemas/Email'
 *             - $ref: '#/components/schemas/Password'
 *     responses:
 *       200:
 *         description: User session credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Credentials'
 *       400:
 *         description: Missing arguments
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       401:
 *         description: Authentication failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (email === undefined || password === undefined) {
    res.status(400).send('Missing Arguments');
    return;
  }

  const user = await usersController.findOneByEmail(email);

  if (user === null) {
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }

  const { accessToken, refreshToken } = usersController.generateTokens(user._id);
  user.tokens.push(refreshToken);
  await user.save();

  res.status(200).send({ accessToken, refreshToken, _id: user._id });
});

const client = new OAuth2Client();

router.post('/google-login', async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: '730785686819-6drdihn4664d094p8ohrj4hk9vfo3f0r.apps.googleusercontent.com',
    });

    const payload = ticket.getPayload();

    const email = payload?.email as string;
    let user = await usersController.findOneByEmail(email);

    if (user === null) {
      if (payload?.picture === undefined || payload.name === undefined) {
        res.sendStatus(500);
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('google-signin', salt);

      const avatarRes = await fetch(payload.picture);

      if (avatarRes.body === null) {
        res.sendStatus(500);
        return;
      }

      const avatar = `public/avatars/${Date.now()}.jpg`
      const systemPath = path.resolve('public/avatars/', `${Date.now()}.jpg`);
      const fileStream = fs.createWriteStream(systemPath, { flags: 'wx' });
      await finished(Readable.fromWeb(avatarRes.body).pipe(fileStream));

      user = await usersController.create({
        username: payload.name,
        password: hashedPassword,
        email,
        avatar,
        tokens: [],
      });
    }

    const { accessToken, refreshToken } = usersController.generateTokens(user._id);
    user.tokens.push(refreshToken);
    await user.save();

    res.status(200).send({ accessToken, refreshToken, _id: user._id });
    return;
  } catch (err) {
    res.status(500).send();
    return;
  }
});

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: logout of user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     responses:
 *       200:
 *         description: Successfully logged out of session
 *       400:
 *         description: Missing arguments
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

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken === undefined) {
    res.sendStatus(400);
    return;
  }

  try {
    const user = await usersController.verifyRefreshToken(refreshToken);

    res.sendStatus(200);
  } catch (err) {
    res.status(403).send('Invalid Request');
  }
});

/**
 * @swagger
 * /users/refresh-token:
 *   post:
 *     summary: refresh user refreshToken
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     responses:
 *       200:
 *         description: User session credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Credentials'
 *       400:
 *         description: Missing arguments
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

router.post('/refresh-token', async (req, res) => {
  const { refreshToken: oldRefreshToken } = req.body;

  if (oldRefreshToken === undefined) {
    res.sendStatus(400);
    return;
  }

  try {
    const user = await usersController.verifyRefreshToken(oldRefreshToken);
    const { accessToken, refreshToken: newRefreshToken } = usersController.generateTokens(user._id);

    user.tokens.push(newRefreshToken);
    await user.save();

    res.status(200).send({ accessToken, refreshToken: newRefreshToken, _id: user._id });
  } catch (err) {
    res.status(403).send('Invalid Request');
  }
});

/**
 * @swagger
 * /users:
 *   put:
 *     summary: Update user username and/or avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *             - $ref: '#/components/schemas/Username'
 *             - $ref: '#/components/schemas/UploadAvatar'
 *     responses:
 *       200:
 *         description: The old user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBUser'
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
 *       404:
 *         description: User does not exist
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       409:
 *         description: Username taken
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.put('/', authenticate, upload.single('avatar'), async (req, res) => {
  const { username } = req.body;
  const file = req.file;
  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const userID = req.user._id;
  const params: Partial<User> = {};

  const oldUser = await usersController.findById(userID);

  if (oldUser === null) {
    res.status(404).send('User does not exist');
    return;
  }

  if (oldUser._id.toJSON() !== userID) {
    res.sendStatus(403);
    return;
  }

  if (username === undefined && file === undefined) {
    res.status(400).send('Missing Arguments');
    return;
  }

  if (username !== undefined) {
    params['username'] = username;
  }

  if (file !== undefined) {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
      await asyncUnlink(file.path);

      res.status(400).send('File Type Unsupported');
      return;
    }

    params['avatar'] = file.path.replaceAll(path.sep, path.posix.sep);
  }

  try {
    let user = await usersController.update(userID, params);
    // user has to exist, we found it earlier
    user = user as unknown as Exclude<typeof user, null>;

    if (file !== undefined) {
      await asyncUnlink(oldUser.avatar);
    }

    res
      .status(200)
      .send({ _id: user._id, username: user.username, avatar: user.avatar, email: user.email });
  } catch (err) {
    if (file !== undefined) {
      await asyncUnlink(file.path);
    }

    throw err;
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get user data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: The id of the post to update
 *     responses:
 *       200:
 *         description: The user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DBUser'
 *       400:
 *         description: Missing arguments
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       401:
 *         description: Authentication failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */

router.get('/:id', async (req, res) => {
  // @ts-expect-error "user" was patched to the req object from the auth middleware
  const id = req.params.id as unknown as Types.ObjectId;
  const params: Partial<User> = {};

  const user = await usersController.findById(id);

  if (user === null) {
    res.status(404).send('User does not exist');
    return;
  }

  res
    .status(200)
    .send({ _id: user._id, username: user.username, avatar: user.avatar, email: user.email });
});

export default router;
