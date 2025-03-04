import type { ExpressRequest } from 'types/express';
import type { NextFunction } from 'express';

import { namespace } from '../../services/database';

import { AUDIT_USERID_KEY } from '@tamanu/constants/audit';

export const attachAuditUserToDbSession = async (req: ExpressRequest , _res: Response, next: NextFunction) => {
  namespace.run(() => {
    namespace.set(AUDIT_USERID_KEY, req.user?.id);
    next();
  });
};
