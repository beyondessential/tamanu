import { buildVersionCompatibilityCheck } from 'shared/utils';
import { InvalidClientHeadersError } from 'shared/errors';

// only works via webpack, not direct nodejs
import pkgjson from '../../package.json';

export const SUPPORTED_CLIENT_VERSIONS = {
  'Tamanu LAN Server': {
    min: pkgjson.version,
    max: pkgjson.version, // note that higher patch versions will be allowed to connect
  },
  'Tamanu Desktop': {
    min: pkgjson.version,
    max: pkgjson.version, // note that higher patch versions will be allowed to connect
  },
  'Tamanu Mobile': {
    min: pkgjson.version,
    max: pkgjson.version, // note that higher patch versions will be allowed to connect
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
