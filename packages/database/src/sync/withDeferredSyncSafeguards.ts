import { QueryTypes } from 'sequelize';

import type { Sequelize } from '../index';

/**
 * Queries for deferrable FK constraint names in the public schema. We scope to FK
 * constraints specifically so that SET CONSTRAINTS ... DEFERRED/IMMEDIATE does not
 * inadvertently affect other deferrable constraint triggers (e.g. the changelog
 * triggers which are DEFERRABLE INITIALLY DEFERRED and should remain deferred
 * until transaction commit).
 */
const getDeferrableFKConstraintNames = async (sequelize: Sequelize): Promise<string[]> => {
  const results = await sequelize.query<{ conname: string }>(
    `
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_namespace n ON c.connamespace = n.oid
    WHERE c.contype = 'f'
      AND c.condeferrable = true -- must be DEFERRABLE
      AND NOT c.condeferred -- not DEFERRED by default (ie: IMMEDIATE)
      AND n.nspname = 'public'
    `,
    { type: QueryTypes.SELECT },
  );
  return results.map(r => r.conname);
};

export const withDeferredSyncSafeguards = async <ReturnT = unknown>(
  sequelize: Sequelize,
  operation: () => Promise<ReturnT>,
): Promise<ReturnT> => {
  if (!sequelize.isInsideTransaction()) {
    throw new Error('withDeferredSyncSafeguards must be called within a transaction');
  }

  const constraintNames = await getDeferrableFKConstraintNames(sequelize);
  if (constraintNames.length === 0) {
    return operation();
  }

  const constraintList = constraintNames.map(name => `"${name}"`).join(', ');

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
   * Only deferrable FK constraints in the public schema are targeted here. This avoids
   * affecting changelog constraint triggers (DEFERRABLE INITIALLY DEFERRED) which should
   * remain deferred until transaction commit.
   * (See 1771485087000-makeSelfReferencingFKDeferrable migration for details)
   */
  await sequelize.query(`SET CONSTRAINTS ${constraintList} DEFERRED;`);

  let operationFailed = false;
  try {
    return await operation();
  } catch (e) {
    operationFailed = true;
    throw e;
  } finally {
    try {
      await sequelize.query(`SET CONSTRAINTS ${constraintList} IMMEDIATE;`);
    } catch (e) {
      if (!operationFailed) {
        // operation() succeeded but a deferred constraint is violated (ie: a foreign key constraint is violated)
        // — this is a real error we want to throw
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