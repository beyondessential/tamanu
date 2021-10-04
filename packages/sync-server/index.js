import config from 'config';

import { log } from 'shared/services/logging';
import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';
import { parseArguments } from 'shared/arguments';

import { createApp } from './app/createApp';
import { initDatabase } from './app/database';
import { startScheduledTasks } from './app/tasks';
import { EmailService } from './app/services/EmailService';
import { ReportRunner } from './app/report/ReportRunner';
import { version } from './package.json';

const port = config.port;

async function setup(store, options) {
  const userCount = await store.models.User.count();
  if (userCount > 0) {
    throw new Error(`Found ${userCount} users already in the database, aborting setup.`);
  }

  // create initial admin user
  const { initialUser } = config.auth;
  if (!initialUser.email) {
    throw new Error(`The initial user in config is missing an email address.`);
  }

  log.info(`Creating initial user account for ${initialUser.email}...`);
  await store.models.User.create(initialUser);
  log.info(`Done.`);
  process.exit(0);
}

async function serve(store, options) {
  log.info(`Starting sync server version ${version}.`);

  if (config.db.migrateOnStartup) {
    await store.sequelize.migrate({ migrateDirection: 'up' });
  } else {
    await store.sequelize.assertUpToDate(options);
  }

  const emailService = new EmailService();
  const context = { store, emailService };
  const app = createApp(context);
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

async function migrate(store, options) {
  await store.sequelize.migrate(options);
  process.exit(0);
}

async function report(store, options) {
  try {
    const { name, parameters, recipients } = options;
    let reportParameters = {};
    let reportRecipients = {};
    try {
      reportParameters = JSON.parse(parameters);
    } catch (error) {
      log.warn(`Failed to parse parameters ${error}`);
    }

    try {
      reportRecipients = JSON.parse(recipients);
    } catch (error) {
      // Backwards compatibility: support previous syntax of plain string
      reportRecipients = {
        email: recipients.split(','),
      };
    }

    const emailService = new EmailService();
    const reportRunner = new ReportRunner(
      name,
      reportParameters,
      reportRecipients,
      store.models,
      emailService,
    );
    log.info(`Running report "${name}" with parameters "${parameters}"`);
    await reportRunner.run();
  } catch (error) {
    // Send error message back to parent process
    process.stderr.write(`Report failed: ${error.message}`);
    process.exit(1);
  }
  process.exit(0);
}

async function run(command, options) {
  const subcommand = {
    serve,
    migrate,
    setup,
    report,
  }[command];

  if (!subcommand) {
    throw new Error(`Unrecognised subcommand: ${command}`);
  }

  const { store } = await initDatabase({ testMode: false });
  return subcommand(store, options);
}

// catch and exit if run() throws an error
(async () => {
  try {
    const { command, ...options } = parseArguments();
    await run(command, options);
  } catch (e) {
    log.error(`run(): fatal error: ${e.toString()}`);
    log.error(e.stack);
    process.exit(1);
  }
})();
