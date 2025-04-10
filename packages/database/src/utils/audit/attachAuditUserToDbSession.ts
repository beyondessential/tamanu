import type { ExpressRequest } from 'types/express';
import type { NextFunction } from 'express';

import { setSessionConfigInNamespace } from '../../services/database';

import { AUDIT_USERID_KEY } from '@tamanu/constants/database';

export const attachAuditUserToDbSession = async (
  req: ExpressRequest & { facilityId: string; settings: any },
  _res: Response,
  next: NextFunction,
) => {
  const { facilityId, settings } = req;
  const auditSettings = await (settings?.[facilityId] || settings)?.get('audit');
  if (!auditSettings?.accesses.enabled) {
    return next();
  }
  setSessionConfigInNamespace(AUDIT_USERID_KEY, req.user?.id, next);
};
