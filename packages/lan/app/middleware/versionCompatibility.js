import { buildVersionCompatibilityCheck } from 'shared/utils';

// If a new version of the desktop app is being released in conjunction with an update to the LAN
// server, set MIN_CLIENT_VERSION to reflect that, and desktop users will be logged out until they
// have updated.

export const MIN_CLIENT_VERSION = '1.26.0';
export const MAX_CLIENT_VERSION = '1.26.2'; // note that higher patch versions will be allowed to connect

export const versionCompatibility = (req, res, next) =>
  buildVersionCompatibilityCheck(MIN_CLIENT_VERSION, MAX_CLIENT_VERSION)(req, res, next);
