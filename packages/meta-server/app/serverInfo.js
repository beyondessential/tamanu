import { version as appVersion } from '../package.json';

// Set a global serverInfo object so that it can be accessed
// from within the shared modules (eg in honeycomb)
global.serverInfo = {
  version: appVersion,
  serverType: 'meta',
};

export const { version } = global.serverInfo;
export const { serverType } = global.serverInfo;
