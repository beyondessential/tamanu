import config from 'config';
import { initDatabase } from './app/database';
import { log } from './app/logging';

import { createApp } from './app/createApp';

const port = config.port;

export async function run() {
  const { sequelize, models } = initDatabase({
    testMode: false,
  });

  // ensure migration is done
  await sequelize.sync();

  const app = createApp({ sequelize, models });
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}!`);
  });
}

run();

/*
import config from 'config';
import RemoteAuth from './app/services/remote-auth';
import { startScheduledTasks } from './app/tasks';
import { startDataChangePublisher } from './DataChangePublisher';
import { setupDatabase, setupListeners } from './app/database';
import { createApp } from './createApp';

import { createInitialAdmin } from './createInitialAdmin';

const port = config.port;
const database = setupDatabase();
const listeners = setupListeners(database);
const app = createApp(database);

const startServer = () => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}!`);
  });
  // Set up change publishing
  startDataChangePublisher(server, database);

  startScheduledTasks(database);
};

async function start() {
  if (database.objects('user').length === 0) {
    await createInitialAdmin(database);
  }

  if (config.offlineMode) {
    startServer(database);
  } else {
    // Prompt user to login before activating sync
    const authService = new RemoteAuth(database);
    authService.promptLogin(() => {
      startServer(database);
      listeners.setupSync();
    });
  }
}

start();
*/
