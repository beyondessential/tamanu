import { EntityManager } from "typeorm";

/**
 * Defer foreign key checks for the duration of the current transaction.
 *
 * This allows self-referencing records (e.g., tasks.parent_task_id) to be
 * inserted in any order without FK violations.
 *
 * Unlike PostgreSQL's SET CONSTRAINTS, SQLite's defer_foreign_keys pragma is
 * automatically reset to OFF when the transaction ends (commit or rollback),
 * so there's no need to restore it in a finally block.
 */
export const deferForeignKeys = async (entityManager: EntityManager): Promise<void> => {
  await entityManager.query('PRAGMA defer_foreign_keys = ON;');
}
