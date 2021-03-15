import config from 'config';
import { initDatabase } from './app/database';
import { log } from './app/logging';

import { createApp } from './app/createApp';

import { startScheduledTasks } from './app/tasks';
import { startDataChangePublisher } from './app/DataChangePublisher';

import { listenForServerQueries } from './app/discovery';

const port = config.port;

export async function run() {
  const context = await initDatabase();

  await context.sequelize.migrate();

  const app = createApp(context);
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });

  listenForServerQueries();

  startScheduledTasks(context);

  startDataChangePublisher(server, context);

  // TODO: sync with remote server
}

run();
