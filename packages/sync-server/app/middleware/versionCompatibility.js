import compareVersions from 'semver-compare';
import { VERSION_COMPATIBILITY_ERRORS } from 'shared/constants';

// If a new version of the mobile app is being released in conjunction with an update to the sync
// server, set `min` for `Tamanu Mobile` to reflect that, and mobile users will be logged out until
// they have updated. Similarly with the LAN server, it won't be able to sync if its version is
// not supported
const SUPPORTED_CLIENT_VERSIONS = {
  'Tamanu LAN Server': {
    min: '1.0.0',
    max: '1.0.0',
  },
  'Tamanu Mobile': {
    min: '1.0.3',
    max: '1.0.3',
  },
};

const respondWithError = (res, error) => {
  res.status(400).json({ error });
};

export const versionCompatibility = (req, res, next) => {
  const clientVersion = req.header('X-Version');
  const clientType = req.header('X-Runtime');

  if (!clientVersion || !clientType) {
    // a thirdparty tool (or internal test suite) is using the API; ignore version checking
    next();
    return;
  }

  const clientTypes = Object.keys(SUPPORTED_CLIENT_VERSIONS);
  if (!clientTypes.includes(clientType)) {
    respondWithError(res, {
      message: `The only supported client types are ${clientTypes.join(', ')}`,
      name: 'InvalidClientType',
    });
    return;
  }

  const clientInfo = SUPPORTED_CLIENT_VERSIONS[clientType];
  const { min, max } = clientInfo;

  // include the min/max supported clients with any response
  res.setHeader(`X-Min-Client-Version`, min);
  res.setHeader(`X-Max-Client-Version`, max);

  // check the connecting client is supported, and respond with an error if not
  if (compareVersions(clientVersion, min) < 0) {
    respondWithError(res, {
      message: VERSION_COMPATIBILITY_ERRORS.LOW,
      name: 'InvalidClientVersion',
    });
    return;
  }
  if (compareVersions(clientVersion, max) > 0) {
    respondWithError(res, {
      message: VERSION_COMPATIBILITY_ERRORS.HIGH,
      name: 'InvalidClientVersion',
    });
    return;
  }
  next();
};
