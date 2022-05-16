import Transport from 'winston-transport';
import Libhoney from 'libhoney';
import config from 'config';

import { version } from '../../../package.json';

const serverInfo = {
  serverType: config?.canonicalHostName ? 'sync' : 'lan',
  syncHost: config?.canonicalHostName,
  facilityId: config?.serverFacilityId,
  node_env: process.env.NODE_ENV,
  version,
};

const { apiKey, dataset, enabled } = config?.honeycomb || {};

const honeyApi = new Libhoney({
  writeKey: apiKey,
  dataset: dataset,
  disabled: !(apiKey && enabled),
});


class HoneycombTransport extends Transport {
  log(info, callback) {
    const event = honeyApi.newEvent();
    event.add(info);
    event.add(serverInfo);
    event.send();
    callback();
  }
}

export const honeycombTransport = new HoneycombTransport();
