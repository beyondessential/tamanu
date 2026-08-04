import type { ExpressRequest } from 'types/express';
import type { NextFunction, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

const auditUserIdAsyncLocalStorage = new AsyncLocalStorage();

export const getAuditUserId = () => auditUserIdAsyncLocalStorage.getStore();

// Credit writes to someone other than whoever is driving the request: a background task, or
// an integration acting on a clinician's behalf. The changelog trigger fires at commit and
// reads the audit user then, so this has to wrap the whole transaction, not one write in it.
export const runWithAuditUser = <T>(userId: string, callback: () => T): T =>
  auditUserIdAsyncLocalStorage.run(userId, callback);

export const attachAuditUserToDbSession = async (
  req: ExpressRequest,
  _res: Response,
  next: NextFunction,
) => {
  auditUserIdAsyncLocalStorage.run(req.user?.id, next);
};
