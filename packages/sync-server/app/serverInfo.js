import { version as appVersion } from '../package.json';

global.serverInfo = {
  version: appVersion,
  serverType: 'sync',
};

export const version = global.serverInfo.version;
export const serverType = global.serverInfo.serverType;
