import config from 'config';
import { log } from './app/logging';
import { createApp } from './app/createApp';
import { initDatabase } from './app/database';

const port = config.port;

async function performInitialSetup({ store }) {
  const userCount = await store.models.User.count();
  if(userCount === 0) {
    // create initial admin user
    const { dummyUserEmail } = config.auth;
    if(dummyUserEmail) {
      log.info(`Creating initial user account for ${dummyUserEmail}...`);
      await store.models.User.create({
        email: dummyUserEmail,
        displayName: 'Initial Admin',
        role: 'administrator',
        password: '',
      });
    }
  }
}

export async function run() {
  const context = await initDatabase({ testMode: false });

  await performInitialSetup(context);

  const app = createApp(context);
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
}

run();
