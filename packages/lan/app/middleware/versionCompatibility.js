import { parse } from 'semver';
import { buildVersionCompatibilityCheck } from '@tamanu/shared/utils';

// only works via webpack, not direct nodejs
import pkgjson from '../../package.json';

const { major, minor } = parse(pkgjson.version);

// In general, all versions in the current minor version should be compatible with each other.
// However, if there is an incompatibility between the desktop client version and a facility server
// version, this can be used to override the forbid clients below a certain version from connecting.
//
// To do so, set this to a string like '1.30.2'.
//
// THIS SHOULD BE RARE and only used in exceptional circumstances.
// When merging to main or other branches, this MUST be reset to null.
const MIN_CLIENT_OVERRIDE = null;

export const MIN_CLIENT_VERSION = MIN_CLIENT_OVERRIDE ?? `${major}.${minor}.0`;
export const MAX_CLIENT_VERSION = `${major}.${minor}.999`;
// Note that .999 is only for clarity; higher patch versions will always be allowed

export const versionCompatibility = (req, res, next) =>
  buildVersionCompatibilityCheck(MIN_CLIENT_VERSION, MAX_CLIENT_VERSION)(req, res, next);
