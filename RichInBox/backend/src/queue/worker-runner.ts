import { closeQueue } from './email-queue';
import { stopWorker, startWorker } from './email-worker';
import { prisma } from '../db/prisma-client';
import { disconnectRedis } from '../redis-connection';

const DEFAULT_RUN_DURATION_MS = 2 * 60 * 1000;

function getRunDuration(): number {
  const rawDuration = process.env.WORKER_RUN_DURATION_MS;
  if (rawDuration === undefined) return DEFAULT_RUN_DURATION_MS;

  const duration = Number(rawDuration);
  if (!Number.isSafeInteger(duration) || duration <= 0) {
    throw new Error('WORKER_RUN_DURATION_MS must be a positive integer');
  }
  return duration;
}

async function run(): Promise<void> {
  const runDuration = getRunDuration();
  let requestStop!: () => void;
  const stopRequested = new Promise<void>((resolve) => {
    requestStop = resolve;
  });
  const onSignal = () => requestStop();
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  try {
    startWorker();
    console.log(`[worker] running for up to ${runDuration}ms`);
    await Promise.race([
      new Promise<void>((resolve) => setTimeout(resolve, runDuration)),
      stopRequested,
    ]);
  } finally {
    process.removeListener('SIGINT', onSignal);
    process.removeListener('SIGTERM', onSignal);
    try {
      await stopWorker();
    } finally {
      try {
        await closeQueue();
      } finally {
        try {
          await disconnectRedis();
        } finally {
          await prisma.$disconnect();
        }
      }
    }
  }
}

run().catch((err) => {
  console.error('[worker] run failed:', err);
  process.exitCode = 1;
});
