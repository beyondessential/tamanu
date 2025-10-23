import type { ExpressRequest } from 'types/express';
import type { NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

const auditUserIdAsyncLocalStorage = new AsyncLocalStorage();

export const getAuditUserId = () => auditUserIdAsyncLocalStorage.getStore();

export const attachAuditUserToDbSession = async (
  req: ExpressRequest,
  _res: Response,
  next: NextFunction,
) => {
  auditUserIdAsyncLocalStorage.run(req.user?.id, next);
};
