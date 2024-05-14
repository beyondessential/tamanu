export async function up(query) {
  await query.renameColumn('scheduled_vaccines', 'schedule', 'dose_label');
}

export async function down(query) {
  await query.renameColumn('scheduled_vaccines', 'dose_label', 'schedule');
}
