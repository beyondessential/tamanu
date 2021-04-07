import { buildVersionCompatibilityCheck } from 'shared/utils';

// If a new version of the mobile app is being released in conjunction with an update to the sync
// server, set `min` for `Tamanu Mobile` to reflect that, and mobile users will be logged out until
// they have updated. Similarly with the LAN server, it won't be able to sync if its version is
// not supported.
const SUPPORTED_CLIENT_VERSIONS = {
  'Tamanu LAN Server': {
    min: '1.0.0',
    max: '1.0.0', // note that higher patch versions will be allowed to connect
  },
  'Tamanu Mobile': {
    min: '1.0.5',
    max: '1.0.5', // note that higher patch versions will be allowed to connect
  },
};

export const versionCompatibility = (req, res, next) => {
  const clientType = req.header('X-Runtime');

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
