import request from 'supertest';
import { Express } from 'express';
import mongoose, { Types } from 'mongoose';
import fs from 'node:fs/promises';
import path from 'path';

import initApp from '../server';
import { type Post, postModel, userModel, type User, type Comment, commentModel } from '../models';

let app: Express;

beforeAll(async () => {
  app = await initApp();
  const dirs = ['public/avatars', 'public/media'];

  for (const dir of dirs) {
    for (const file of await fs.readdir(dir)) {
      if (file !== '.gitkeep') {
        await fs.unlink(path.join(dir, file));
      }
    }
  }

  await userModel.deleteMany();
  await postModel.deleteMany();
  await commentModel.deleteMany();
});

beforeEach(async () => {
  let response = await request(app)
    .post('/users/register')
    .field('username', testUser.username)
    .field('email', testUser.email)
    .field('password', testUser.password)
    .attach('avatar', testUser.avatar);

  const { _id: userID } = response.body;
  testUser._id = userID;

  response = await request(app)
    .post('/users/login')
    .send({ email: testUser.email, password: testUser.password });

  const { accessToken, refreshToken } = response.body;
  testUser.accessToken = accessToken;
  testUser.refreshToken = refreshToken;

  response = await request(app)
    .post('/posts')
    .set('Cookie', [`access-token=${testUser.accessToken}`])
    .field('content', testPost.content)
    .attach('media', testPost.media);
  const { _id: postID } = response.body;
  testPost._id = postID;
});

afterEach(async () => {
  const dirs = ['public/avatars', 'public/media'];

  for (const dir of dirs) {
    for (const file of await fs.readdir(dir)) {
      if (file !== '.gitkeep') {
        await fs.unlink(path.join(dir, file));
      }
    }
  }

  await userModel.deleteMany();
  await postModel.deleteMany();
  await commentModel.deleteMany();
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

const baseUrl = '/comments';
const testUser: Omit<User, 'tokens'> & { refreshToken: string; accessToken: string } = {
  username: 'TestUser',
  email: 'test@user.com',
  password: 'testPassword',
  avatar: 'src/tests/fixtures/profile-picture.png',
  refreshToken: '',
  accessToken: '',
  _id: '' as unknown as Types.ObjectId,
};
const testPost: Required<Pick<Post, 'content' | 'media'>> & Omit<Post, 'userID'> = {
  content: 'Test content',
  media: 'src/tests/fixtures/profile-picture.png',
  _id: '' as unknown as Types.ObjectId,
};

const testComment: Omit<Comment, 'userID' | '_id' | 'postID'> = {
  content: 'Test content',
};

describe('Comment Tests', () => {
  test('Comment test fail post comment without auth', async () => {
    const response = await request(app)
      .post(baseUrl)
      .send({ content: testComment.content, postID: testPost._id });
    expect(response.statusCode).toBe(401);
  });

  test('Comment test fail post comment without content', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ postID: testPost._id });

    expect(response.statusCode).toBe(400);
  });

  test('Comment test fail post comment without postID', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content });

    expect(response.statusCode).toBe(400);
  });

  test('Comment test post comment', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    expect(response.statusCode).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.content).toBeDefined();
    expect(response.body.userID).toBeDefined();
    expect(response.body.postID).toBeDefined();
  });

  test('Comment test get all comment', async () => {
    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    const response = await request(app)
      .get(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);
    expect(response.statusCode).toBe(200);
    expect(response.body.comments.length).toBe(2);
  });

  test('Comment test get all comments by user id', async () => {
    const newTestUser = { ...testUser };
    newTestUser.email += 'a';

    await request(app)
      .post('/users/register')
      .field('username', newTestUser.username)
      .field('email', newTestUser.email)
      .field('password', newTestUser.password)
      .attach('avatar', newTestUser.avatar);

    let response = await request(app)
      .post('/users/login')
      .send({ email: newTestUser.email, password: newTestUser.password });

    const { accessToken, refreshToken, _id: newTestUserID } = response.body;
    newTestUser.accessToken = accessToken;
    newTestUser.refreshToken = refreshToken;

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${newTestUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    response = await request(app)
      .get(`${baseUrl}?userID=${newTestUserID}`)
      .set('Cookie', [`access-token=${newTestUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.comments.length).toBe(1);
  });

  test('Comment test get all comments by not user id', async () => {
    const newTestUser = { ...testUser };
    newTestUser.email += 'a';

    await request(app)
      .post('/users/register')
      .field('username', newTestUser.username)
      .field('email', newTestUser.email)
      .field('password', newTestUser.password)
      .attach('avatar', newTestUser.avatar);

    let response = await request(app)
      .post('/users/login')
      .send({ email: newTestUser.email, password: newTestUser.password });

    const { accessToken, refreshToken, _id: newTestUserID } = response.body;
    newTestUser.accessToken = accessToken;
    newTestUser.refreshToken = refreshToken;

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${newTestUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    response = await request(app)
      .get(`${baseUrl}?notUserID=${newTestUserID}`)
      .set('Cookie', [`access-token=${newTestUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.comments.length).toBe(1);
  });

  test('Comment test get all comments by post id', async () => {
    let response = await request(app)
      .post('/posts')
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);
    const { _id: newPostID } = response.body;

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: newPostID });

    response = await request(app)
      .get(`${baseUrl}?postID=${newPostID}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.comments.length).toBe(1);
  });

  test('Comment test get all comments with limit', async () => {
    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let response = await request(app)
      .get(`${baseUrl}?limit=1`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.comments.length).toBe(1);
  });

  test('Comment test get all comments by lastID', async () => {
    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    const { _id: lastID } = response.body;

    response = await request(app)
      .get(`${baseUrl}?lastID=${lastID}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.comments.length).toBe(1);
  });

  test('Comment test fail get comment by id no such id', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    response = await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    response = await request(app)
      .get(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);
    expect(response.statusCode).toBe(404);
  });

  test('Comment test get comment by id', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    response = await request(app)
      .get(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);
    expect(response.statusCode).toBe(200);
  });

  test('Comment test fail update comment without auth', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    response = await request(app).put(`${baseUrl}/${_id}`);

    expect(response.statusCode).toBe(401);
  });

  test('Comment test fail update comment not exist', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    response = await request(app)
      .put(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(404);
  });

  test('Comment test fail update comment not comment owner', async () => {
    const newTestUser = { ...testUser };
    newTestUser.email += 'a';

    await request(app)
      .post('/users/register')
      .field('username', newTestUser.username)
      .field('email', newTestUser.email)
      .field('password', newTestUser.password)
      .attach('avatar', newTestUser.avatar);

    let response = await request(app)
      .post('/users/login')
      .send({ email: newTestUser.email, password: newTestUser.password });

    const { accessToken, refreshToken, _id: newTestUserID } = response.body;
    newTestUser.accessToken = accessToken;
    newTestUser.refreshToken = refreshToken;

    response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${newTestUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    response = await request(app)
      .put(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(403);
  });

  test('Comment test update comment', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    const updatedComment: typeof testComment = {
      content: testComment.content + 'a',
    };

    response = await request(app)
      .put(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: updatedComment.content });
    expect(response.statusCode).toBe(200);

    response = await request(app)
      .get(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.body._id).toBeDefined();
    expect(response.body.userID).toBeDefined();
    expect(response.body.postID).toBeDefined();
    expect(response.body.content).toBeDefined();
    expect(response.body.content).toBe(updatedComment.content);
  });

  test('Comment test fail delete comment without auth', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    response = await request(app).delete(`${baseUrl}/${_id}`);

    expect(response.statusCode).toBe(401);
  });

  test('Comment test fail delete comment no such id', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    response = await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(404);
  });

  test('Comment test fail delete comment not comment owner', async () => {
    const newTestUser = { ...testUser };
    newTestUser.email += 'a';

    await request(app)
      .post('/users/register')
      .field('username', newTestUser.username)
      .field('email', newTestUser.email)
      .field('password', newTestUser.password)
      .attach('avatar', newTestUser.avatar);

    let response = await request(app)
      .post('/users/login')
      .send({ email: newTestUser.email, password: newTestUser.password });

    const { accessToken, refreshToken, _id: newTestUserID } = response.body;
    newTestUser.accessToken = accessToken;
    newTestUser.refreshToken = refreshToken;

    response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${newTestUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    response = await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(403);
  });

  test('Comment test delete comment', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    let { _id } = response.body;

    response = await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBeDefined();
    expect(response.body.content).toBeDefined();
    expect(response.body.postID).toBeDefined();
    expect(response.body.userID).toBeDefined();

    response = await request(app)
      .get(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);
    expect(response.body.comments.length).toBe(0);
  });

  test('Comment test get comment count by postID', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    response = await request(app)
      .get(`${baseUrl}/count?postID=${testPost._id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(1);
  });

  test('Comment test get comment count by userID', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testComment.content, postID: testPost._id });

    response = await request(app)
      .get(`${baseUrl}/count?userID=${testUser._id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(1);
  });
});
