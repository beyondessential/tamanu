import config from 'config';
import { log } from './app/logging';
import { createApp } from './app/createApp';
import { initDatabase } from './app/database';
import { startScheduledTasks } from './app/tasks';

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
  const context = await initDatabase({ testMode: false });

  await performInitialSetup(context);

  const app = createApp(context);
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });

  startScheduledTasks(context);
}

run();
