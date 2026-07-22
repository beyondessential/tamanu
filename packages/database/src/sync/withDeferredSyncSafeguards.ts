import { QueryTypes } from 'sequelize';

import type { Sequelize } from '../index';

/**
 * Queries for deferrable foreign key and unique constraint names in the public schema.
 * We scope to FK ('f') and unique ('u') constraints specifically so that
 * SET CONSTRAINTS ... DEFERRED/IMMEDIATE does not inadvertently affect other deferrable
 * constraint triggers (e.g. the changelog triggers which are DEFERRABLE INITIALLY
 * DEFERRED and should remain deferred until transaction commit).
 */
const getDeferrableConstraintNames = async (sequelize: Sequelize): Promise<string[]> => {
  const results = await sequelize.query<{ conname: string }>(
    `
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_namespace n ON c.connamespace = n.oid
    WHERE c.contype IN ('f', 'u')
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

  const constraintNames = await getDeferrableConstraintNames(sequelize);
  if (constraintNames.length === 0) {
    return operation();
  }

  const constraintList = constraintNames.map(name => `"${name}"`).join(', ');

  /**
   * Defer foreign key and unique constraint assertions until the end of the transaction.
   *
   * This prevents constraint violations during data synchronization when dealing with:
   * - self-referencing foreign keys (e.g., tasks.parent_task_id, invoice_payments.original_payment_id)
   * - unique constraints
   *
   * Without deferral, these constraints would be checked immediately upon insertion,
   * causing failures when the batch's mid-application state is invalid even though its
   * end state is not.
   *
   * Only deferrable FK and unique constraints in the public schema are targeted here.
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
