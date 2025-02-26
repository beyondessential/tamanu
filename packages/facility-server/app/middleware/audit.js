import { namespace } from '@tamanu/database/services/database';

export const attachAuditUserToDbSession = async (req, _res, next) => {
  namespace.run(() => {
    namespace.set('tamanu.audit.userid', req.user?.id);
    next();
  });
};

