import asyncHandler from 'express-async-handler';

import { ForbiddenError } from '@tamanu/errors';
import { ReadSettings } from '@tamanu/settings';
import { ipMatchesCidrList } from '@tamanu/utils';

/**
 * The login-level IP gate, enforced at the facility's own door (first
 * contact): with a non-empty auth.ipAllowlist, refuse login attempts from
 * outside every listed range. The setting syncs, so this works offline too.
 * Central applies the same gate to logins that reach it directly.
 */
export const ipAllowlistGate = asyncHandler(async (req, _res, next) => {
  const allowlist = await new ReadSettings(req.models).get('auth.ipAllowlist');
  if (Array.isArray(allowlist) && allowlist.length > 0 && !ipMatchesCidrList(req.ip, allowlist)) {
    throw new ForbiddenError('Logins are not allowed from this network');
  }
  next();
});
