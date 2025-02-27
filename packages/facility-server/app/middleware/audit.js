import { namespace } from '@tamanu/database/services/database';
import { AUDIT_USERID_KEY } from '@tamanu/constants/auth';

export const attachAuditUserToDbSession = async (req, _res, next) => {
  namespace.run(() => {
    namespace.set(AUDIT_USERID_KEY, req.user?.id);
    next();
  });
};
