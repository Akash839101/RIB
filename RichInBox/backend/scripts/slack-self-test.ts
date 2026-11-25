import { prisma } from '../src/db/prisma-client';
import { deliver, postMessage } from '../src/services/slack-service';

(async () => {
  const c = await prisma.slackConnection.findFirst();
  if (!c) {
    console.log('no Slack connection');
    process.exit(0);
  }
  console.log('target:', {
    channelId: c.channelId,
    channelName: c.channelName,
    hasWebhook: Boolean(c.incomingWebhookUrl),
  });

  try {
    await postMessage(c.botToken, c.channelId, ':wave: ReachInbox bot post test');
    console.log('bot postMessage: OK');
  } catch (e) {
    console.log('bot postMessage FAILED:', (e as Error).message);
  }

  try {
    await deliver(c, ':wave: ReachInbox deliver() test');
    console.log('deliver(): OK');
  } catch (e) {
    console.log('deliver() FAILED:', (e as Error).message);
  }

  await prisma.$disconnect();
})();
