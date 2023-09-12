import Transport from 'winston-transport';
import Libhoney from 'libhoney';
import config from 'config';
import { serviceContext, serviceName } from './context';
import { LogSignatureCache } from './signatureCache';

const context = serviceContext();

const { apiKey, enabled, level = 'info' } = config?.honeycomb || {};

const dataset = serviceName(context);
const honeyApi = new Libhoney({
  writeKey: apiKey,
  dataset,
  disabled: !(apiKey && enabled && dataset),
});

class HoneycombTransport extends Transport {
  signatureCache = new LogSignatureCache();

  log(info, callback) {
    const { message, level, ...data } = info;
    const safe = this.signatureCache.checkSignature(message, data);
    if (!safe) {
      // not sure what null represents here as the exact usage of callback
      // is undocumented - just copying from how winston-transport appears
      // to handle errors in its own source
      callback(null);
      return;
    }
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
