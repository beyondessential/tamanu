import { readFileSync } from 'fs';
import { join } from 'path';

import { buildVersionCompatibilityCheck } from 'shared/utils';

const { version } = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

export const MIN_CLIENT_VERSION = version;
export const MAX_CLIENT_VERSION = version; // note that higher patch versions will be allowed to connect

export const versionCompatibility = (req, res, next) =>
  buildVersionCompatibilityCheck(MIN_CLIENT_VERSION, MAX_CLIENT_VERSION)(req, res, next);
