import { buildVersionCompatibilityCheck } from 'shared/utils';

// only works via webpack, not direct nodejs
import pkgjson from '../../package.json';

export const MIN_CLIENT_VERSION = pkgjson.version;
export const MAX_CLIENT_VERSION = pkgjson.version; // note that higher patch versions will be allowed to connect

export const versionCompatibility = (req, res, next) =>
  buildVersionCompatibilityCheck(MIN_CLIENT_VERSION, MAX_CLIENT_VERSION)(req, res, next);
