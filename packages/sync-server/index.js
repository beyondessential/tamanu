import config from 'config';
import { log } from './app/logging';
import { createApp } from './app/createApp';
import { initDatabase } from './app/database';

const port = config.port;

async function performInitialSetup({ sequelize, models }) {
  // sync models with database
  await sequelize.sync();

  /*
  const existingUser = await models.User.findOne();
  if (existingUser) {
    // database has been populated
    return;
  }
  */
}

export async function run() {
  const context = initDatabase({
    testMode: false,
  });

  await performInitialSetup(context);

  const app = createApp(context);
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
}

run();
