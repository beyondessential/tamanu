export async function up(query) {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS notes_record_id_idx;
  `);
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS notes_record_id_idx ON notes USING HASH (record_id);
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    DROP INDEX IF EXISTS notes_record_id_idx;
  `);
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS notes_record_id_idx ON notes (record_id); -- btree is default
  `);
}
