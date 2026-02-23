import type { Sequelize } from '../index';

export const withDeferredSyncSafeguards = async <ReturnT = unknown>(
  sequelize: Sequelize,
  operation: () => Promise<ReturnT>,
): Promise<ReturnT> => {
  if (!sequelize.isInsideTransaction()) {
    throw new Error('withDeferredSyncSafeguards must be called within a transaction');
  }

  /**
   * Defer foreign key constraint assertions until the end of the transaction.
   *
   * This prevents constraint violations during data synchronization when dealing with
   * self-referencing foreign keys (e.g., tasks.parent_task_id, invoice_payments.original_payment_id).
   *
   * Without deferral, these constraints would be checked immediately upon insertion,
   * causing failures when parent records haven't been inserted yet. The hierarchical
   * nature of this data makes it complicated to guarantee correct insertion order.
   *
   * Note: Only constraints explicitly altered to be DEFERRABLE will be affected.
   * (See 1771485087000-makeSelfReferencingFKDeferrable migration for details)
   * Standard foreign key constraints continue to be enforced immediately.
   */
  await sequelize.query('SET CONSTRAINTS ALL DEFERRED;');

  let operationFailed = false;
  try {
    return await operation();
  } catch (e) {
    operationFailed = true;
    throw e;
  } finally {
    try {
      await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE;');
    } catch (e) {
      if (!operationFailed) {
        // operation() succeeded but a deferred constraint is violated (ie: a foreign key constraint is violated) 
        // — this is a real error we want to throw this error
        // eslint-disable-next-line no-unsafe-finally
        throw e;
      }

      // operation() already failed — swallow the secondary error so the original propagates
      // this is because if try block throws an error, then the finally block also throws an error,
      // and the original error is lost.
      console.error('Failed to reset constraints to IMMEDIATE (suppressed):', e);
    }
  }
};