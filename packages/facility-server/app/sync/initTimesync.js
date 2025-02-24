import config from 'config';
import { create as createTimesync } from 'timesync';

export const initTimesync = ({ models, centralServer }) => {
  if (!config.timesync.enabled) return;
  const timesync = createTimesync({
    server: `${centralServer.host}/timesync`,
    interval: config.timesync.interval,

  });
  timesync.on('change', (offset) => {
    models.LocalSystemFact.set('timesyncOffset', offset);
  });
  return timesync;
};
