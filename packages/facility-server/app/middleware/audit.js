import { namespace } from '@tamanu/database/services/database';

export const attachAuditUserToDbSession = async (req, res, next) => {
  namespace.run(() => {
    namespace.set("audit.userid", req.user?.id);
    next();
  });
};
