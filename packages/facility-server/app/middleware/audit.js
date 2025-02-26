import { namespace } from '@tamanu/database/services/database';

export const attachAuditUserToDbSession = async (req, _res, next) => {
  namespace.run(() => {
    namespace.set('audit.userid', req.user?.id);
    namespace.set('audit.endpoint', `${req.method} ${req.path}`);
    next();
  });
};

