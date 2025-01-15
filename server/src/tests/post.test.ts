import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'path';

import initApp from '../server';
import { type Post, postModel, userModel, type User } from '../models';

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
});

beforeEach(async () => {
  await request(app)
    .post('/users/register')
    .field('username', testUser.username)
    .field('email', testUser.email)
    .field('password', testUser.password)
    .attach('avatar', testUser.avatar);

  const response = await request(app)
    .post('/users/login')
    .send({ email: testUser.email, password: testUser.password });

  const { accessToken, refreshToken } = response.body;
  testUser.accessToken = accessToken;
  testUser.refreshToken = refreshToken;
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
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

const baseUrl = '/posts';
const testUser: Omit<User, '_id' | 'tokens'> & { refreshToken: string; accessToken: string } = {
  username: 'TestUser',
  email: 'test@user.com',
  password: 'testPassword',
  avatar: 'src/tests/fixtures/profile-picture.png',
  refreshToken: '',
  accessToken: '',
};
const testPost: Required<Pick<Post, 'content' | 'media'>> & Omit<Post, 'userID' | '_id'> = {
  content: 'Test content',
  media: 'src/tests/fixtures/profile-picture.png',
};

describe('Post Tests', () => {
  test('Post test fail post post without auth', async () => {
    const file = await fs.readFile(testPost.media);
    const response = await request(app)
      .post(baseUrl)
      .field('content', testPost.content)
      .attach('media', file);

    expect(response.statusCode).toBe(401);
  });

  test('Post test fail post post without content', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .attach('media', testPost.media);

    expect(response.statusCode).toBe(400);
  });

  test('Post test fail post post bad media file format', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', 'src/tests/fixtures/bad-profile-picture.webp');

    expect(response.statusCode).toBe(400);
  });

  test('Post test post post with only content', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .send({ content: testPost.content });

    expect(response.statusCode).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.userID).toBeDefined();
    expect(response.body.content).toBeDefined();
    expect(response.body.media).not.toBeDefined();
  });

  test('Post test post post with everything', async () => {
    const response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    expect(response.statusCode).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.userID).toBeDefined();
    expect(response.body.content).toBeDefined();
    expect(response.body.media).toBeDefined();
  });

  test('Post test get all posts', async () => {
    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    const response = await request(app)
      .get(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(2);
  });

  test('Post test get all posts with limit', async () => {
    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    const response = await request(app)
      .get(baseUrl + '?limit=1')
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(1);
  });

  test('Post test get all posts by lastID', async () => {
    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    const { _id: lastID } = response.body;

    response = await request(app)
      .get(baseUrl + '?lastID=' + lastID)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(1);
    expect(response.body.posts[0]._id).not.toBe(lastID);
  });

  test('Post test get all posts by user id', async () => {
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
      .field('content', testPost.content)
      .attach('media', testPost.media);

    await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    response = await request(app).get(`${baseUrl}?userID=${newTestUserID}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.posts.length).toBe(1);
  });

  test('Post test fail get post by id no such id', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    response = await request(app)
      .get(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(404);
  });

  test('Post test get post by id', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app)
      .get(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
  });

  test('Post test fail update post without auth', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app).put(`${baseUrl}/${_id}`);

    expect(response.statusCode).toBe(401);
  });

  test('Post test update post fail bad media file format', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app)
      .put(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .attach('media', 'src/tests/fixtures/bad-profile-picture.webp');

    expect(response.statusCode).toBe(400);
  });

  test('Post test update post fail no such post', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    response = await request(app)
      .put(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(404);
  });

  test('Post test update post fail not allowed for not post owner', async () => {
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
      .field('content', testPost.content);

    let { _id } = response.body;

    response = await request(app)
      .put(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(403);
  });

  test('Post test update post', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id, media: oldMedia } = response.body;

    const updatedPost: typeof testPost = {
      content: testPost.content + 'a',
      media: testPost.media,
    };

    response = await request(app)
      .put(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', updatedPost.content)
      .attach('media', updatedPost.media);
    expect(response.statusCode).toBe(200);

    response = await request(app)
      .get(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.body._id).toBeDefined();
    expect(response.body.userID).toBeDefined();
    expect(response.body.media).toBeDefined();
    expect(response.body.media).not.toBe(oldMedia);
    expect(response.body.content).toBeDefined();
    expect(response.body.content).toBe(updatedPost.content);
  });

  test('Post test fail delete post without auth', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app).delete(`${baseUrl}/${_id}`);

    expect(response.statusCode).toBe(401);
  });

  test('Post test delete post fail not exist', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    response = await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(404);
  });

  test('Post test delete post fail not allowed for not post owner', async () => {
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
      .field('content', testPost.content);

    let { _id } = response.body;

    response = await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(403);
  });

  test('Post test delete post', async () => {
    let response = await request(app)
      .post(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`])
      .field('content', testPost.content)
      .attach('media', testPost.media);

    let { _id } = response.body;

    response = await request(app)
      .get(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    const oldPostsLength = response.body.posts.length;

    response = await request(app)
      .delete(`${baseUrl}/${_id}`)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBeDefined();
    expect(response.body.content).toBeDefined();
    expect(response.body.media).toBeDefined();
    expect(response.body.userID).toBeDefined();

    response = await request(app)
      .get(baseUrl)
      .set('Cookie', [`access-token=${testUser.accessToken}`]);

    expect(response.body.posts.length).toBe(oldPostsLength - 1);
  });
});
