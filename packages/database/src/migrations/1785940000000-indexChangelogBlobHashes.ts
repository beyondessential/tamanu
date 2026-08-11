import { QueryInterface } from 'sequelize';

// spec: RECL
// Reclamation asks, of each candidate blob, whether any changelog entry still
// carries its hash. Without this the question is a scan of the whole changelog
// per candidate. A GIN index over record_data cannot serve the `->>`
// extraction (see dropUnusedChangelogIndexes), so this is a btree over the
// extracted value.
//
// Scoped to the tables that actually reference blobs. `logs.changes` takes a row
// for every write anywhere in the database, so a predicate matching on the
// extraction alone would evaluate on all of them and index every unrelated row
// that happens to carry a `hash` key. Narrowing it keeps the index small and its
// write cost off the rest of the schema. A source registered later, or one whose
// hash column is not named `hash`, needs its own index to match: the reclamation
// query reads each source by its own column.
//
// The build itself scans `logs.changes` whole and holds ACCESS EXCLUSIVE while it
// does, which on a large deployment is the slowest step of the upgrade that
// carries it. Migrations run inside a transaction here, so CONCURRENTLY is not
// available.
//
// No matching mobile (TypeORM) migration: mobile keeps no changelog.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX changes_blob_hash
    ON logs.changes ((record_data->>'hash'))
    WHERE table_schema = 'public'
      AND table_name IN ('attachments', 'assets')
      AND record_data->>'hash' IS NOT NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP INDEX IF EXISTS logs.changes_blob_hash;');
}
