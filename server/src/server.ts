import * as dotenv from 'dotenv';
dotenv.config();
// monkey patch errors thrown from async functions to trigger express error handler
import 'express-async-errors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import errorhandler from 'errorhandler';
import express, { Request } from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { postsRouter, commentsRouter, usersRouter, likesRouter, geminiRouter } from './routes';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: ['http://localhost:3001'], credentials: true }));
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/users', usersRouter);
app.use('/likes', likesRouter);
app.use('/gemini', geminiRouter);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Web Dev 2025 REST API',
      version: '1.0.0',
      description: 'REST server including authentication using JWT',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./src/routes/*.ts'],
};
const specs = swaggerJsDoc(options);
app.use('/docs', swaggerUI.serve, swaggerUI.setup(specs));

app.use('/public/', express.static(path.join(__dirname, '..', 'public')));

app.use(errorhandler());

const initApp = async (args: { startExpress: boolean } = { startExpress: false }) => {
  const db_url = process.env.DB_URL as string;

  await mongoose.connect(db_url, { serverSelectionTimeoutMS: 5000 });

  console.log('connected to database');

  if (args.startExpress) {
    const port = process.env.SERVER_PORT;

    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  }

  return app;
};

export default initApp;
