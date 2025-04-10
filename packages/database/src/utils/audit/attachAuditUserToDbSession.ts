import type { ExpressRequest } from 'types/express';
import type { NextFunction } from 'express';

import { setSessionConfigInNamespace } from '../../services/database';

import { AUDIT_USERID_KEY } from '@tamanu/constants/database';

export const attachAuditUserToDbSession = async (
  req: ExpressRequest,
  _res: Response,
  next: NextFunction,
) => {
  setSessionConfigInNamespace(AUDIT_USERID_KEY, req.user?.id, next);
};
