import config from 'config';
import { create as createTimesync } from 'timesync';

import { log } from '@tamanu/shared/services/logging';

export const initTimesync = ({ models, centralServer }) => {
  if (!config.timesync.enabled) return;

  const server = `${centralServer.host}/timesync`;
  const { interval } = config.timesync;

  log.info('Initializing timesync', { server, interval });
  const timesync = createTimesync({ server, interval });

  timesync.on('change', (offset) => {
    log.debug('Timesync offset changed', { offset });
    models.LocalSystemFact.set('timesyncOffset', offset);
  });

  return timesync;
};
