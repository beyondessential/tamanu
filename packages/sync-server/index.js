import config from 'config';

import { log } from 'shared/services/logging';
import { createReferralNotification } from 'shared/tasks/CreateReferralNotification';

import { createApp } from './app/createApp';
import { initDatabase } from './app/database';
import { startScheduledTasks } from './app/tasks';

import { parseArguments } from './app/arguments';

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

function addHooks(context) {
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

function isFirstProcess() {
  // NODE_APP_INSTANCE is set by PM2; if it's not present, assume this process is the first
  return !process.env.NODE_APP_INSTANCE || (process.env.NODE_APP_INSTANCE === '0');
}

async function serve() {
  const isFirstProcess = isFirstProcess();
  const context = await initDatabase({ 
    isFirstProcess,
    testMode: false,
  });

  await performInitialSetup(context);

  addHooks(context);

  const app = createApp(context);
  app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });

  // only execute tasks on the first worker process
  if (isFirstProcess) {
    startScheduledTasks(context);
  }
}

async function migrate({ migrateDir }) {
  const context = await initDatabase({ 
    isFirstProcess: isFirstProcess(),
    testMode: false,
  });

  log.info(`Running migrations: ${migrateDir}`)
}

const commandActions = {
  serve,
  migrate,
};

async function run() {
  try {
    const { command, ...options } = parseArguments();

    const action = commandActions[command];
    if (!action) {
      throw new Error(`Invalid command ${command}`);
    }

    await action(options);
  } catch(e) {
    // catch and exit if run() throws an error
    log.error(`run(): fatal error: ${e.toString()}`);
    log.error(e.stack);
    process.exit(1);
  }
}

run();
