import '@babel/polyfill';
import config from 'config';
import { log } from './app/logging';
import { createApp } from './app/createApp';
import { initDatabase } from './app/database';

const port = config.port;

async function performInitialSetup({ db }) {
  // TODO: initial population
}

export async function run() {
  const context = await initDatabase({
    testMode: false,
  });

  await performInitialSetup(context);

  const app = createApp(context);
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
}

run();
