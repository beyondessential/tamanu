import config from 'config';

import { log } from 'shared/services/logging';
import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';

import { createApp } from '../app/createApp';
import { startScheduledTasks } from '../app/tasks';
import { EmailService } from '../app/services/EmailService';
import { version } from '../package.json';

const port = config.port;

export async function serve(store, options) {
  log.info(`Starting sync server version ${version}.`);

  if (config.db.migrateOnStartup) {
    await store.sequelize.migrate({ migrateDirection: 'up' });
  } else {
    await store.sequelize.assertUpToDate(options);
  }

  const emailService = new EmailService();
  const context = { store, emailService };
  const app = createApp(context);

  if (process.env.PRINT_ROUTES === 'true') {
    // console instead of log.info is fine here because the aim is to output the
    // routes without wrapping, supressing, or transporting the output
    console.log(getRoutes(app._router).join('\n'));
  }

  app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
  process.on('SIGTERM', () => {
    app.close();
  });

  // only execute tasks on the first worker process
  // NODE_APP_INSTANCE is set by PM2; if it's not present, assume this process is the first
  const isFirstProcess = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';
  if (isFirstProcess) {
    await startScheduledTasks(context);
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
