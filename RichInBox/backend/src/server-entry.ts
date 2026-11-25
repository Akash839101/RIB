import { env } from './config/environment-config';
import { createApp } from './express-app';
import { prisma } from './db/prisma-client';
import { disconnectRedis } from './redis-connection';
import { closeQueue, getQueue } from './queue/email-queue';
import { startWorker, stopWorker } from './queue/email-worker';
import { ensureIndex } from './services/elasticsearch-service';

async function main(): Promise<void> {
  // Touch the queue early so misconfiguration fails fast.
  getQueue();

  await ensureIndex();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[api] listening on ${env.apiPublicUrl} (port ${env.port})`);
  });

  startWorker();

  const shutdown = async (signal: string) => {
    console.log(`[api] ${signal} received, shutting down...`);
    server.close();
    await stopWorker();
    await closeQueue();
    await disconnectRedis();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[api] fatal startup error:', err);
  process.exit(1);
});
