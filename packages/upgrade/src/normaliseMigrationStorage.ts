import { QueryTypes } from 'sequelize';
import type { Sequelize } from '@tamanu/database';

// Migrations load from TypeScript source, so umzug names them `.ts`, but databases migrated
// before the build-less switch hold `.js` records for the same migrations. Rewrite those records
// to `.ts` before any migration state is consulted (createMigrationInterface asserts this has
// happened) so already-applied migrations aren't seen as pending and re-run. Idempotent; a no-op
// before the storage table exists (fresh database) or once the rename is done.
export async function normaliseMigrationStorageExtensions(sequelize: Sequelize): Promise<void> {
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
  // it isn't passed explicitly.
  await sequelize.transaction(async () => {
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
