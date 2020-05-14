import config from 'config';
import { initDatabase } from './app/database';
import { log } from './app/logging';

import { createApp } from './app/createApp';
import { createInitialAdmin } from './app/createInitialAdmin';

import { startScheduledTasks } from './app/tasks';
import { startDataChangePublisher } from './app/DataChangePublisher';

const port = config.port;

async function performInitialSetup({ sequelize, models }) {
  // sync models with database
  // (TODO: proper migrations)
  await sequelize.sync();

  // create an initial admin user if no admin users exist
  const admin = await models.User.findOne({ where: { role: 'admin' } });
  if (!admin) {
    await createInitialAdmin(models.User);
  }
}

export async function run() {
  const database = initDatabase({
    testMode: false,
  });

  await performInitialSetup(database);

  const app = createApp(database);
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });

  // TODO: port scheduled tasks
  // startScheduledTasks(database);

  // TODO: change publishing
  // startDataChangePublisher(server, database);

  // TODO: sync with remote server
  //
}

run();
