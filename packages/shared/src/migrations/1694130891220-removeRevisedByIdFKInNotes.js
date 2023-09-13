export async function up(query) {
  await query.removeConstraint('notes', 'notes_revised_by_id_fkey');
}

export async function down(query) {
  await query.addConstraint('notes', {
    type: 'foreign key',
    name: 'notes_revised_by_id_fkey',
    fields: ['revised_by_id'],
    references: {
      table: 'notes',
      field: 'id',
    },
  });
}
