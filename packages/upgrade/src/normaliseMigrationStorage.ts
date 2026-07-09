import { QueryTypes, type Transaction } from 'sequelize';
import type { Sequelize } from '@tamanu/database';

// Migrations load from TypeScript source, so umzug names them `.ts`, but databases migrated
// before the build-less switch hold `.js` records for the same migrations. Rewrite those records
// to `.ts` before any migration state is consulted (createMigrationInterface asserts this has
// happened) so already-applied migrations aren't seen as pending and re-run. Idempotent; a no-op
// before the storage table exists (fresh database) or once the rename is done.
//
// `parentTransaction` is passed during a dry run so the rewrite nests as a SAVEPOINT under the
// outer rollback transaction; without it the bare transaction below would commit independently
// and persist the rename even though the dry run reports nothing committed.
export async function normaliseMigrationStorageExtensions(
  sequelize: Sequelize,
  parentTransaction: Transaction | null = null,
): Promise<void> {
  const [table] = await sequelize.query<{ name: string | null }>(
    `SELECT to_regclass('public."SequelizeMeta"') AS name`,
    { type: QueryTypes.SELECT },
  );
  if (!table?.name) return;

  const [stale] = await sequelize.query(
    `SELECT 1 FROM public."SequelizeMeta" WHERE name LIKE '%.js' LIMIT 1`,
    { type: QueryTypes.SELECT },
  );
  if (!stale) return;

  // Run the delete and rename in one transaction so a crash between them can't leave a `.js`
  // record dropped but its `.ts` rename unapplied. CLS binds the transaction to the queries, so
  // it isn't passed to them explicitly. During a dry run, nesting under parentTransaction makes
  // this a SAVEPOINT that rolls back with the outer transaction; a null parent is a normal
  // top-level transaction.
  await sequelize.transaction({ transaction: parentTransaction }, async () => {
    // Drop any `.js` record whose `.ts` equivalent already exists so the rename below cannot hit
    // the name primary key.
    await sequelize.query(
      `DELETE FROM public."SequelizeMeta" m
         WHERE name LIKE '%.js'
           AND EXISTS (
             SELECT 1 FROM public."SequelizeMeta" o
              WHERE o.name = regexp_replace(m.name, '\\.js$', '.ts')
           )`,
    );
    await sequelize.query(
      `UPDATE public."SequelizeMeta" SET name = regexp_replace(name, '\\.js$', '.ts') WHERE name LIKE '%.js'`,
    );
  });
}
