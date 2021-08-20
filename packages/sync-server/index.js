import config from 'config';

import { log } from 'shared/services/logging';
import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';

import { createApp } from './app/createApp';
import { initDatabase } from './app/database';
import { startScheduledTasks } from './app/tasks';
import { EmailService } from './app/services/EmailService';

const port = config.port;

async function performInitialSetup({ store }) {
  const userCount = await store.models.User.count();
  if (userCount > 0) {
    return;
  }

  // create initial admin user
  const { initialUser } = config.auth;
  if (!initialUser.email) {
    return;
  }

  log.info(`Creating initial user account for ${initialUser.email}...`);
  await store.models.User.create(initialUser);
}

export async function run() {
  // NODE_APP_INSTANCE is set by PM2; if it's not present, assume this process is the first
  const isFirstProcess = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';
  const { store } = await initDatabase({ isFirstProcess, testMode: false });
  const emailService = new EmailService();
  const context = { store, emailService };

  await performInitialSetup(context);

  const app = createApp(context);
  app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
  process.on('SIGTERM', () => {
    app.close();
  });

  // only execute tasks on the first worker process
  if (isFirstProcess) {
    startScheduledTasks(context);
  }

  if (config.notifications && config.notifications.referralCreated) {
    context.models.Referral.addHook(
      'afterCreate',
      'create referral notification hook',
      referral => {
        createReferralNotification(referral, context.models);
      },
    );
  }
}

// catch and exit if run() throws an error
(async () => {
  try {
    await run();
  } catch (e) {
    log.error(`run(): fatal error: ${e.toString()}`);
    process.exit(1);
  }
})();
