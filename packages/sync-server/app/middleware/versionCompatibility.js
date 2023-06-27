import { buildVersionCompatibilityCheck } from 'shared/utils';
import { InvalidClientHeadersError } from 'shared/errors';

// If a new version of the mobile app is being released in conjunction with an update to the sync
// server, set `min` for `Tamanu Mobile` to reflect that, and mobile users will be logged out until
// they have updated. Similarly with the LAN server, it won't be able to sync if its version is
// not supported.
export const SUPPORTED_CLIENT_VERSIONS = {
  'Tamanu LAN Server': {
    min: '1.26.0',
    max: '1.26.3', // note that higher patch versions will be allowed to connect
  },
  'Tamanu Desktop': {
    min: '1.26.0',
    max: '1.26.3', // note that higher patch versions will be allowed to connect
  },
  'Tamanu Mobile': {
    min: '1.26.0',
    max: '1.26.3', // note that higher patch versions will be allowed to connect
  },
  'fiji-vps': {
    min: null,
    max: null,
  },
  'fiji-vrs': {
    min: null,
    max: null,
  },
  medici: {
    min: null,
    max: null,
  },
  mSupply: {
    min: null,
    max: null,
  },
  FHIR: {
    min: null,
    max: null,
  },
};

export const versionCompatibility = (req, res, next) => {
  const clientType = req.header('X-Tamanu-Client');

  if (!clientType) {
    // a thirdparty tool (or internal test suite) is using the API; ignore version checking
    next();
    return;
  }

  const clientTypes = Object.keys(SUPPORTED_CLIENT_VERSIONS);
  if (!clientTypes.includes(clientType)) {
    next(
      new InvalidClientHeadersError(
        `The only supported X-Tamanu-Client values are ${clientTypes.join(', ')}`,
      ),
    );
    return;
  }

  const clientInfo = SUPPORTED_CLIENT_VERSIONS[clientType];
  const { min, max } = clientInfo;

  const runCheck = buildVersionCompatibilityCheck(min, max);
  runCheck(req, res, next);
};
