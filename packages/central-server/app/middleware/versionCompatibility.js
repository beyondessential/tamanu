import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'semver';
import { buildVersionCompatibilityCheck } from '@tamanu/shared/utils';
import { InvalidClientHeadersError } from '@tamanu/shared/errors';
import { SERVER_TYPES } from '@tamanu/constants';

const pkgpath = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');
const pkgjson = JSON.parse(readFileSync(pkgpath, 'utf8'));
const { major, minor } = parse(pkgjson.version);

// In general, all versions in the current minor version should be compatible with each other.
// However, if there is an incompatibility between any (web, facility) client version and a
// central server version, this can be used to override the forbid clients below a certain version
// from connecting.
//
// To do so, set this to a string like '1.30.2'.
//
// THIS SHOULD BE RARE and only used in exceptional circumstances.
// When merging to main or other branches, this MUST be reset to null.
const MIN_CLIENT_OVERRIDE = null;

export const MIN_CLIENT_VERSION = MIN_CLIENT_OVERRIDE ?? `${major}.${minor}.0`;
export const MAX_CLIENT_VERSION = `${major}.${minor}.999`;
// Note that .999 is only for clarity; higher patch versions will always be allowed

export const SUPPORTED_CLIENT_VERSIONS = {
  [SERVER_TYPES.FACILITY]: {
    min: MIN_CLIENT_VERSION,
    max: MAX_CLIENT_VERSION,
  },
  [SERVER_TYPES.WEBAPP]: {
    min: MIN_CLIENT_VERSION,
    max: MAX_CLIENT_VERSION,
  },
  [SERVER_TYPES.MOBILE]: {
    min: MIN_CLIENT_VERSION,
    max: MAX_CLIENT_VERSION,
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
