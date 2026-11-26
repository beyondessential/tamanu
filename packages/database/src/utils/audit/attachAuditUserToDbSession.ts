import type { ExpressRequest } from 'types/express';
import type { NextFunction, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

const auditUserIdAsyncLocalStorage = new AsyncLocalStorage();

export const getAuditUserId = () => auditUserIdAsyncLocalStorage.getStore();

/** Records the database changes `fn` makes against `userId` in the changelog. */
export const runWithAuditUser = <T>(userId: string | undefined, fn: () => T): T =>
  auditUserIdAsyncLocalStorage.run(userId, fn);

export const attachAuditUserToDbSession = async (
  req: ExpressRequest,
  _res: Response,
  next: NextFunction,
) => {
  runWithAuditUser(req.user?.id, next);
};
