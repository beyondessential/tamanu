import Transport from 'winston-transport';
import Libhoney from 'libhoney';
import config from 'config';

const version = '1.xx.0'; // TODO: how to fetch version from shared?!

const honeyApi = new Libhoney({
  writeKey: config.honeycomb.apiKey,
  dataset: "initial-test",
  disabled: !(config.honeycomb.apiKey && config.honeycomb.enabled),
});

const serverInfo = {
  serverType: config.canonicalHostName ? 'sync' : 'lan',
  syncHost: config.canonicalHostName,
  facilityId: config.serverFacilityId,
  node_env: process.env.NODE_ENV,
  version,
};

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