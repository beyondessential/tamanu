import { version as appVersion } from '../package.json';

// Set a global serverInfo object so that it can be accessed 
// from within the shared modules (eg in honeycomb)
global.serverInfo = {
  version: appVersion,
  serverType: 'sync',
};

export const version = global.serverInfo.version;
export const serverType = global.serverInfo.serverType;
