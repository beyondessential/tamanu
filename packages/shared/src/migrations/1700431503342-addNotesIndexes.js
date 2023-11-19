export async function up(query) {
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS notes_revised_by_id ON notes (revised_by_id);
    CREATE INDEX IF NOT EXISTS notes_note_type ON notes (note_type);
    CREATE INDEX IF NOT EXISTS notes_record_type ON notes (record_type);
`);
}

export async function down(query) {
  await query.sequelize.query(`
    DROP INDEX notes_revised_by_id;
    DROP INDEX notes_note_type;
    DROP INDEX notes_record_type;
  `);
}
