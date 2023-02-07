import Transport from 'winston-transport';
import Libhoney from 'libhoney';
import config from 'config';
import { serviceContext, serviceName } from './context';

const context = serviceContext();
const legacyNames = {
  deployment: context[SemanticAttributes.DEPLOYMENT_NAME],
  facilityId: context[SemanticAttributes.DEPLOYMENT_FACILITY],
  nodeEnv: context[SemanticAttributes.DEPLOYMENT_ENVIRONMENT],
  processId: context[SemanticAttributes.PROCESS_ID],
  hostname: context[SemanticAttributes.NET_HOST_NAME],
  version: context[SemanticAttributes.SERVICE_VERSION],
  serverType: context[SemanticAttributes.SERVICE_TYPE],
};

const { apiKey, enabled } = config?.honeycomb || {};

const honeyApi = new Libhoney({
  writeKey: apiKey,
  dataset: serviceName(context),
  disabled: !(apiKey && enabled),
});

class HoneycombTransport extends Transport {
  log(info, callback) {
    const event = honeyApi.newEvent();
    event.add(info);
    event.add(context);
    event.add(legacyNames);
    event.send();
    callback();
  }
}

export const honeycombTransport = new HoneycombTransport();
