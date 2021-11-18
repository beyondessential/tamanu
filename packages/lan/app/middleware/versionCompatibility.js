import { buildVersionCompatibilityCheck } from 'shared/utils';

// If a new version of the desktop app is being released in conjunction with an update to the LAN
// server, set MIN_CLIENT_VERSION to reflect that, and desktop users will be logged out until they
// have updated.
export const SUPPORTED_CLIENT_VERSIONS = {
  'Tamanu Desktop': {
    min: '1.10.0',
    max: '1.10.0', // note that higher patch versions will be allowed to connect
  },
};

export const versionCompatibility = buildVersionCompatibilityCheck(SUPPORTED_CLIENT_VERSIONS);
