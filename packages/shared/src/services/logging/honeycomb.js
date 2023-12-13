import config from 'config';
import Transport from 'winston-transport';
import Libhoney from 'libhoney';
import { serviceContext, serviceName } from './context';
import { log } from './log';
import { setupTracing } from './tracing';

const { apiKey } = config.honeyComb;

class HoneycombTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.honeyApi = opts.honeyApi;
    this.context = opts.context;
  }
  log(info, callback) {
    const event = this.honeyApi.newEvent();
    event.add(this.context);
    event.add(info);
    event.send();
    callback();
  }
}

export const initHoneyComb = async ({ settings }) => {
  const { enabled, level = 'info' } = await settings.get('honeycomb');

  const context = serviceContext();

  const dataset = serviceName(context);
  const honeyApi = new Libhoney({
    writeKey: apiKey,
    dataset,
    disabled: !(apiKey && enabled && dataset),
  });

  const honeycombTransport = new HoneycombTransport({
    level,
    context,
    honeyApi,
  });
  log.add(honeycombTransport);

  await setupTracing({ settings });
};
