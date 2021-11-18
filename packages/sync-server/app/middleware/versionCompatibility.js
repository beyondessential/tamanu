import { buildVersionCompatibilityCheck } from 'shared/utils';

// If a new version of the mobile app is being released in conjunction with an update to the sync
// server, set `min` for `Tamanu Mobile` to reflect that, and mobile users will be logged out until
// they have updated. Similarly with the LAN server, it won't be able to sync if its version is
// not supported.
export const SUPPORTED_CLIENT_VERSIONS = {
  'Tamanu LAN Server': {
    min: '1.10.0',
    max: '1.10.1', // note that higher patch versions will be allowed to connect
  },
  'Tamanu Mobile': {
    min: '1.10.0',
    max: '1.10.99', // note that higher patch versions will be allowed to connect
  },
  'Fiji VPS': {
    min: null,
    max: null,
  },
};

export const versionCompatibility = buildVersionCompatibilityCheck(SUPPORTED_CLIENT_VERSIONS);
