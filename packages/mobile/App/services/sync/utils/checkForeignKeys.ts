import { EntityManager } from 'typeorm';

interface ForeignKeyViolation {
  table: string;
  rowid: number | null;
  parent: string;
  fkid: number;
}

/**
 * Surface any foreign key violations across the given tables, naming the offending records.
 *
 * Sync defers foreign key checks (see deferForeignKeys) so records can be inserted in any
 * order within the transaction. The downside is that a genuine violation only fails at commit,
 * as an anonymous "FOREIGN KEY constraint failed" with no indication of which record is at
 * fault. Running foreign_key_check before commit, while the rows are still present, lets us map
 * each violation back to its record id and throw a descriptive error instead.
 *
 * Must be called inside the sync transaction, after saving and before commit.
 */
export const checkForeignKeys = async (
  entityManager: EntityManager,
  tableNames: string[],
): Promise<void> => {
  // A single argument-less foreign_key_check scans every table in one round-trip; filtering the
  // result to the synced tables is far cheaper than issuing one PRAGMA per model (20-30+ awaits).
  const allViolations: ForeignKeyViolation[] = await entityManager.query(
    'PRAGMA foreign_key_check;',
  );
  const syncedTables = new Set(tableNames);

  const violations: string[] = [];
  for (const { table, rowid, parent } of allViolations) {
    if (!syncedTables.has(table)) continue;
    const [record] =
      rowid == null
        ? []
        : await entityManager.query(`SELECT id FROM "${table}" WHERE rowid = ?;`, [rowid]);
    const recordId = record?.id ?? `rowid ${rowid}`;
    violations.push(`${table} record '${recordId}' references a missing ${parent} record`);
  }

  if (violations.length) {
    throw new Error(`Foreign key constraint failed during sync: ${violations.join('; ')}`);
  }
};
