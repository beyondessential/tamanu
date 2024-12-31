export async function up(query) {
  await query.renameTable('patient_letter_templates', 'templates');
}

export async function down(query) {
  await query.renameTable('templates', 'patient_letter_templates');
}
