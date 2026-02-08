import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';

import { env } from './utils/env.js';
import contactsRouter from './routers/contacts.js';
import authRouter from './routers/auth.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import swaggerUI from 'swagger-ui-express';

const PORT = Number(env('PORT', '3000'));

export const setupServer = () => {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(cookieParser());

  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    }),
  );

  app.use('/docs', express.static(path.join(process.cwd(), 'docs')));
  app.use('/swagger', express.static(path.join(process.cwd(), 'swagger')));

  const swaggerJsonPath = path.join(process.cwd(), 'docs', 'swagger.json');
  const swaggerSpecUrl = fs.existsSync(swaggerJsonPath)
    ? '/docs/swagger.json'
    : '/docs/openapi.yaml';

  app.use(
    '/api-docs',
    swaggerUI.serve,
    swaggerUI.setup(null, {
      explorer: true,
      swaggerOptions: { url: swaggerSpecUrl },
    }),
  );

  app.get('/', (req, res) => {
    res.json({
      message: 'Contacts API is running!',
      endpoints: {
        auth: '/auth/register, /auth/login',
        contacts: '/contacts',
        apiDocs: '/api-docs',
      },
    });
  });

  app.use('/auth', authRouter);
  app.use('/contacts', contactsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
