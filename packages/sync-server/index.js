import config from 'config';
import { log } from './app/logging';
import { createApp } from './app/createApp';
import { initDatabase } from './app/database';
import { startScheduledTasks } from './app/tasks';

const port = config.port;

async function performInitialSetup({ db }) {
  // TODO: initial population
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
