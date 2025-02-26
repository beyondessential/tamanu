import { namespace } from '@tamanu/database/services/database';

export const attachAuditUserToDbSession = async (req, res, next) => {
  namespace.run(() => {
    namespace.set('userid', req.user?.id);
    next();
  });
};

