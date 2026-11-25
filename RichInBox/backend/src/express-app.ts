import express, { Application } from 'express';
import 'express-async-errors';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/environment-config';
import { getQueue } from './queue/email-queue';
import { authRouter } from './routes/auth-routes';
import { sendersRouter } from './routes/sender-routes';
import { emailsRouter } from './routes/email-routes';
import { slackRouter } from './routes/slack-routes';
import { errorHandler, notFound } from './middleware/error-middleware';

export function createApp(): Application {
  const app = express();
  const allowedOrigins: (string | RegExp)[] = [env.webAppOrigin, env.apiPublicUrl];
  if (!env.isProd) {
    allowedOrigins.push(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/);
  }

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/senders', sendersRouter);
  app.use('/api/emails', emailsRouter);
  app.use('/api/slack', slackRouter);

  if (env.bullBoardEnabled) {
    // Lazy require so the queue (and Redis) is only touched when enabled.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createBullBoard } = require('@bull-board/api');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ExpressAdapter } = require('@bull-board/express');

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    createBullBoard({
      queues: [new BullMQAdapter(getQueue())],
      serverAdapter,
    });
    app.use('/admin/queues', serverAdapter.getRouter());
    console.log('[api] BullMQ dashboard at /admin/queues');
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
