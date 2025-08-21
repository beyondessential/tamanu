import pkg from '../package.json';

// Set a global serverInfo object so that it can be accessed
// from within the shared modules
global.serverInfo = {
  version: pkg.version,
  serverType: 'central',
};

export const { version } = global.serverInfo;
export const { serverType } = global.serverInfo;
