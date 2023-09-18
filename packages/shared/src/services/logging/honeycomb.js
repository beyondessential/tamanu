import Transport from 'winston-transport';
import Libhoney from 'libhoney';
import config from 'config';
import { serviceContext, serviceName } from './context';

const context = serviceContext();

const { apiKey, enabled, level = 'info' } = config?.honeycomb || {};

const dataset = serviceName(context);
const honeyApi = new Libhoney({
  writeKey: apiKey,
  dataset,
  disabled: !(apiKey && enabled && dataset),
});

class HoneycombTransport extends Transport {
  log(info, callback) {
    const event = honeyApi.newEvent();
    event.add(context);
    event.add(info);
    event.send();
    callback();
  }
}

export const honeycombTransport = new HoneycombTransport({
  level,
});
