import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'path';

import initApp from '../server';
import { userModel, type User } from '../models';

let app: Express;

beforeAll(async () => {
  app = await initApp();
  const imagesDir = 'public/avatars';

  for (const file of await fs.readdir(imagesDir)) {
    if (file !== '.gitkeep') {
      await fs.unlink(path.join(imagesDir, file));
    }
  }

  await userModel.deleteMany();
});

afterEach(async () => {
  const imagesDir = 'public/avatars';

  for (const file of await fs.readdir(imagesDir)) {
    if (file !== '.gitkeep') {
      await fs.unlink(path.join(imagesDir, file));
    }
  }

  await userModel.deleteMany();
});

afterAll((done) => {
  mongoose.connection.close();
  done();
});

const baseUrl = '/users';
const testUser: Omit<User, '_id' | 'tokens'> = {
  username: 'TestUser',
  email: 'test@user.com',
  password: 'testPassword',
  avatar: 'src/tests/fixtures/profile-picture.png',
};

describe('User Tests', () => {
  test('User test register fail missing username', async () => {
    const response = await request(app)
      .post(baseUrl + '/register')
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);
    expect(response.statusCode).toBe(400);
  });

  test('User test register fail missing email', async () => {
    const response = await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);
    expect(response.statusCode).toBe(400);
  });

  test('User test register fail missing password', async () => {
    const response = await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .attach('avatar', testUser.avatar);
    expect(response.statusCode).toBe(400);
  });

  test('User test register fail missing avatar', async () => {
    const response = await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password);
    expect(response.statusCode).toBe(400);
  });

  test('User test register fail bad avatar file format', async () => {
    const response = await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', 'src/tests/fixtures/bad-profile-picture.webp');
    expect(response.statusCode).toBe(400);
  });

  test('User test register email taken', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    const response = await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);
    expect(response.statusCode).toBe(409);
  });

  test('User test register', async () => {
    const response = await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);
    expect(response.statusCode).toBe(201);
    expect(response.body._id).toBeDefined();
    expect(response.body.username).toBeDefined();
    expect(response.body.avatar).toBeDefined();
    expect(response.body.email).toBeDefined();
  });

  test('User test login fail missing email', async () => {
    const response = await request(app)
      .post(baseUrl + '/login')
      .send({ password: testUser.password });
    expect(response.statusCode).toBe(400);
  });

  test('User test login fail missing password', async () => {
    const response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email });
    expect(response.statusCode).toBe(400);
  });

  test('User test login fail not exist user with email', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    const response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email + 'a', password: testUser.password });
    expect(response.statusCode).toBe(401);
  });

  test('User test login fail not matching password', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    const response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password + 'a' });
    expect(response.statusCode).toBe(401);
  });

  test('User test login', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    const response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body._id).toBeDefined();
  });

  test('User test login issues more tokens', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    let response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken: firstAccessToken, refreshToken: firstRefreshToken } = response.body;

    response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken: secondAccessToken, refreshToken: secondRefreshToken } = response.body;

    expect(firstAccessToken).not.toBe(secondAccessToken);
    expect(firstRefreshToken).not.toBe(secondRefreshToken);
  });

  test('User test refresh token fail missing refreshToken', async () => {
    const response = await request(app).post(baseUrl + '/refresh-token');
    expect(response.statusCode).toBe(400);
  });

  test('User test refresh token', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    let response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken: oldAccessToken, refreshToken } = response.body;

    await new Promise((resolve) => setTimeout(resolve, 5000));

    response = await request(app)
      .put(baseUrl)
      .set('Cookie', [`access-token=${oldAccessToken}`])
      .send({
        username: 'OtherTestUser',
      });
    expect(response.statusCode).toBe(403);

    response = await request(app)
      .post(baseUrl + '/refresh-token')
      .send({
        refreshToken: refreshToken,
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body._id).toBeDefined();

    const { accessToken: newAccessToken } = response.body;

    response = await request(app)
      .put(baseUrl)
      .set('Cookie', [`access-token=${newAccessToken}`])
      .send({
        username: 'OtherTestUser',
      });
    expect(response.statusCode).toBe(200);
  }, 10000);

  test('User test refresh token fail double use token', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    let response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { refreshToken } = response.body;

    response = await request(app)
      .post(baseUrl + '/refresh-token')
      .send({
        refreshToken: refreshToken,
      });
    expect(response.statusCode).toBe(200);

    const response2 = await request(app)
      .post(baseUrl + '/refresh-token')
      .send({
        refreshToken: refreshToken,
      });
    expect(response2.statusCode).toBe(403);
  });

  test('User test refresh token fail invalidated all refresh tokens', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    let response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { refreshToken } = response.body;

    response = await request(app)
      .post(baseUrl + '/refresh-token')
      .send({
        refreshToken: refreshToken,
      });

    const { refreshToken: newRefreshToken } = response.body;

    response = await request(app)
      .post(baseUrl + '/refresh-token')
      .send({
        refreshToken: refreshToken,
      });
    expect(response.statusCode).toBe(403);

    response = await request(app)
      .post(baseUrl + '/refresh-token')
      .send({
        refreshToken: newRefreshToken,
      });
    expect(response.statusCode).toBe(403);
  });

  test('User test update fail missing access-token', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    let response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken } = response.body;

    response = await request(app).put(baseUrl);
    expect(response.statusCode).toBe(401);
  });

  test('User test update fail bad avatar file format', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    let response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken } = response.body;

    response = await request(app)
      .put(baseUrl)
      .set('Cookie', [`access-token=${accessToken}`])
      .attach('avatar', 'src/tests/fixtures/bad-profile-picture.webp');
    expect(response.statusCode).toBe(400);
  });

  test('User test update user', async () => {
    let response = await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    const oldAvatar = response.body.avatar;

    response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { accessToken } = response.body;
    const newUsername = testUser.username + 'a';

    response = await request(app)
      .put(baseUrl)
      .set('Cookie', [`access-token=${accessToken}`])
      .field('username', newUsername)
      .attach('avatar', testUser.avatar);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBeDefined();
    expect(response.body.username).toBeDefined();
    expect(response.body.avatar).toBeDefined();
    expect(response.body.email).toBeDefined();

    expect(response.body.username).toBe(newUsername);
    expect(response.body.avatar).not.toBe(oldAvatar);
  });

  test('User test logout fail missing refresh token', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const response = await request(app).post(baseUrl + '/logout');
    expect(response.statusCode).toBe(400);
  });

  test('User test logout', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    let response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { refreshToken } = response.body;

    response = await request(app)
      .post(baseUrl + '/logout')
      .send({
        refreshToken,
      });

    expect(response.statusCode).toBe(200);

    response = await request(app)
      .post(baseUrl + '/logout')
      .send({
        refreshToken,
      });
    expect(response.statusCode).toBe(403);
  });

  test('User test fail get user details no user', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    let response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { _id } = response.body;

    await userModel.findByIdAndDelete(_id);

    response = await request(app).get(baseUrl + '/' + _id);

    expect(response.statusCode).toBe(404);
  });

  test('User test get user details', async () => {
    await request(app)
      .post(baseUrl + '/register')
      .field('username', testUser.username)
      .field('email', testUser.email)
      .field('password', testUser.password)
      .attach('avatar', testUser.avatar);

    let response = await request(app)
      .post(baseUrl + '/login')
      .send({ email: testUser.email, password: testUser.password });

    const { _id } = response.body;

    response = await request(app).get(baseUrl + '/' + _id);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBeDefined();
    expect(response.body.username).toBeDefined();
    expect(response.body.avatar).toBeDefined();
    expect(response.body.email).toBeDefined();
  });
});
