import { buildVersionCompatibilityCheck } from 'shared/utils';

// If a new version of the mobile app is being released in conjunction with an update to the sync
// server, set `min` for `Tamanu Mobile` to reflect that, and mobile users will be logged out until
// they have updated. Similarly with the LAN server, it won't be able to sync if its version is
// not supported.
export const SUPPORTED_CLIENT_VERSIONS = {
  'Tamanu LAN Server': {
    min: '1.11.0',
    max: '1.11.0', // note that higher patch versions will be allowed to connect
  },
  'Tamanu Mobile': {
    min: '1.10.0',
    max: '1.10.99', // note that higher patch versions will be allowed to connect
  },
  'Fiji VPS': {
    min: null,
    max: null,
  },
  'Fiji VRS': {
    min: null,
    max: null,
  },
};

export const versionCompatibility = (req, res, next) => {
  // TODO: X-Runtime is deprecated
  const clientType = req.header('X-Tamanu-Client') || req.header('X-Runtime');

  if (!clientType) {
    // a thirdparty tool (or internal test suite) is using the API; ignore version checking
    next();
    return;
  }

  const clientTypes = Object.keys(SUPPORTED_CLIENT_VERSIONS);
  if (!clientTypes.includes(clientType)) {
    res.status(400).json({
      error: {
        message: `The only supported client types are ${clientTypes.join(', ')}`,
        name: 'InvalidClientType',
      },
    });
    return;
  }

  const clientInfo = SUPPORTED_CLIENT_VERSIONS[clientType];
  const { min, max } = clientInfo;

  const runCheck = buildVersionCompatibilityCheck(min, max);
  runCheck(req, res, next);
};
