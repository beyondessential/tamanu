export async function up(query) {
  await query.renameColumn('administered_vaccines', 'given_overseas', 'given_elsewhere');
}

export async function down(query) {
  await query.renameColumn('administered_vaccines', 'given_elsewhere', 'given_overseas');
}
