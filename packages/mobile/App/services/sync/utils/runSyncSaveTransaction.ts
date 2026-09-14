import type { EntityManager } from 'typeorm';

import { Database } from '~/infra/db';
import { deferForeignKeys } from './deferForeignKeys';
import { checkForeignKeys } from './checkForeignKeys';

/**
 * Run the sync save inside a transaction with foreign key checks deferred, and only pay for the
 * foreign key diagnostic if the commit actually fails.
 *
 * With deferred foreign keys SQLite counts violations incrementally as rows are written and fails
 * the COMMIT if any remain, which is the same guarantee as PostgreSQL's deferred constraints. What
 * it doesn't give us is a message naming the offending record. After a failed deferred COMMIT the
 * transaction is left open with the rows still present, so we can run `foreign_key_check` at that
 * point, scoped to the tables the save touched, and throw a descriptive error before rolling back.
 *
 * TypeORM's `EntityManager.transaction` rolls back inside its own catch before the callback can
 * see the commit error, hence driving the query runner directly. The react-native and node sqlite
 * drivers both hand out a single shared query runner and their `release()` is a no-op, so there is
 * nothing to release here.
 *
 * @param work Saves records using the given (transactional) entity manager, and resolves to the
 * names of the tables that received rows.
 */
export const runSyncSaveTransaction = async (
  work: (entityManager: EntityManager) => Promise<Set<string>>,
): Promise<void> => {
  const queryRunner = Database.client.createQueryRunner();
  await queryRunner.startTransaction();
  try {
    await deferForeignKeys(queryRunner.manager);
    const touchedTables = await work(queryRunner.manager);
    try {
      await queryRunner.commitTransaction();
    } catch (commitError) {
      // Throws a descriptive error if the failure was a foreign key violation
      await checkForeignKeys(queryRunner.manager, [...touchedTables]);
      // Otherwise the commit failed for some other reason
      throw commitError;
    }
  } catch (error) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  }
};
