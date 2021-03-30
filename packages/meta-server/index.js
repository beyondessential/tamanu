import config from 'config';

import { log } from 'shared/services/logging';

import { createApp } from './app/createApp';

const port = config.port;

export async function run() {
  const app = createApp();
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });
}

run();
