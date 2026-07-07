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
  const violations: string[] = [];
  for (const tableName of tableNames) {
    const rows: ForeignKeyViolation[] = await entityManager.query(
      `PRAGMA foreign_key_check("${tableName}");`,
    );
    for (const { table, rowid, parent } of rows) {
      const [record] =
        rowid == null
          ? []
          : await entityManager.query(`SELECT id FROM "${table}" WHERE rowid = ?;`, [rowid]);
      const recordId = record?.id ?? `rowid ${rowid}`;
      violations.push(`${table} record '${recordId}' references a missing ${parent} record`);
    }
  }

  if (violations.length) {
    throw new Error(`Foreign key constraint failed during sync: ${violations.join('; ')}`);
  }
};
