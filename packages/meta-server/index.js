import { version } from './app/serverInfo';
import config from 'config';

import { log } from '@tamanu/shared/services/logging';

import { createApp } from './app/createApp';

const port = config.port;

export async function run() {
  log.info(`Starting meta server version ${version}`);

  const app = createApp();
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
  process.once('SIGTERM', () => {
    log.info('Received SIGTERM, closing HTTP server');
    server.close();
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
