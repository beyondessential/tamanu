import type { EntityManager } from 'typeorm';
import { groupBy } from 'es-toolkit/compat';

interface ForeignKeyViolation {
  table: string;
  rowid: number | null;
  parent: string;
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
 * Must be called inside the sync transaction, after saving and before commit. Pass only the
 * tables that actually received rows: `PRAGMA foreign_key_check("table")` rescans every row of
 * that table, and the argument-less form rescans the whole database, so the cost is proportional
 * to the tables checked rather than to the number of round trips.
 */
export const checkForeignKeys = async (
  entityManager: EntityManager,
  tableNames: string[],
): Promise<void> => {
  const relevantViolations: ForeignKeyViolation[] = [];
  for (const table of tableNames) {
    const violations: ForeignKeyViolation[] = await entityManager.query(
      `PRAGMA foreign_key_check("${table}");`,
    );
    relevantViolations.push(...violations);
  }
  if (!relevantViolations.length) return;

  // Resolve rowids to record ids one query per table (rather than one per violation) to avoid an
  // N+1 round-trip when a large sync leaves many rows referencing missing parents.
  const violationsByTable = groupBy(relevantViolations, ({ table }) => table);
  const idByRowid = new Map<string, string>();
  for (const [table, tableViolations] of Object.entries(violationsByTable)) {
    const rowids = tableViolations.map(({ rowid }) => rowid).filter(rowid => rowid != null);
    if (!rowids.length) continue;
    const placeholders = rowids.map(() => '?').join(', ');
    const records: { rowid: number; id: string }[] = await entityManager.query(
      `SELECT rowid, id FROM "${table}" WHERE rowid IN (${placeholders});`,
      rowids,
    );
    for (const { rowid, id } of records) {
      idByRowid.set(`${table}:${rowid}`, id);
    }
  }

  const violations = relevantViolations.map(({ table, rowid, parent }) => {
    const recordId = idByRowid.get(`${table}:${rowid}`) ?? `rowid ${rowid}`;
    return `${table} record '${recordId}' references a missing ${parent} record`;
  });

  throw new Error(`Foreign key constraint failed during sync: ${violations.join('; ')}`);
};
