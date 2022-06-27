import Transport from 'winston-transport';
import Libhoney from 'libhoney';
import config from 'config';

const serverInfo = {
  syncHost: config?.canonicalHostName,
  facilityId: config?.serverFacilityId,
  nodeEnv: process.env.NODE_ENV,
  ...global.serverInfo,
};

const { apiKey, dataset, enabled } = config?.honeycomb || {};

const honeyApi = new Libhoney({
  writeKey: apiKey,
  dataset,
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
