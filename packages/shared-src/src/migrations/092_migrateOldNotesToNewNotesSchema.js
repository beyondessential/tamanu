export async function up(query) {
  await query.sequelize.query(`
    INSERT INTO note_pages(id, record_id, record_type, note_type, date, created_at, updated_at, deleted_at)
    SELECT id::uuid, record_id, record_type, note_type, date, created_at, updated_at, deleted_at FROM notes
  `);

  await query.sequelize.query(`
    INSERT INTO note_items(id, note_page_id, content, date, author_id, on_behalf_of_id, created_at, updated_at, deleted_at)
    SELECT id::uuid, id::uuid, content, date, author_id, on_behalf_of_id, created_at, updated_at, deleted_at FROM notes
  `);

  await query.renameTable('notes', 'notes_legacy');
}

export async function down(query) {
  await query.renameTable('notes_legacy', 'notes');
  await query.dropTable('note_items');
  await query.dropTable('note_pages');
}
