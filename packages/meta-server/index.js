import config from 'config';

import { log } from 'shared/services/logging';

import { createApp } from './app/createApp';

const port = config.port;

export async function run() {
  const app = createApp();
  app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
}

// catch and exit if run() throws an error
(async () => {
  try {
    await run();
  } catch (e) {
    log.error(`run(): fatal error: ${e.toString()}`);
    log.error(e.stack);
    process.exit(1);
  }
})();
