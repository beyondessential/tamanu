import { QueryInterface } from 'sequelize';

// spec: RECL
// Reclamation asks, of each candidate blob, whether any changelog entry still
// carries its hash. Without this the question is a scan of the whole changelog
// per candidate. A GIN index over record_data cannot serve the `->>`
// extraction (see dropUnusedChangelogIndexes), so this is a btree over the
// extracted value.
//
// The partial predicate is on the extraction alone rather than on the table
// names that carry hashes today: `record_data->>'hash' = $1` implies it
// whatever the reference tables are, so registering a new blob-referencing
// table does not silently cost the index.
//
// No matching mobile (TypeORM) migration: mobile keeps no changelog.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE INDEX changes_blob_hash
    ON logs.changes ((record_data->>'hash'))
    WHERE record_data->>'hash' IS NOT NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query('DROP INDEX IF EXISTS logs.changes_blob_hash;');
}
