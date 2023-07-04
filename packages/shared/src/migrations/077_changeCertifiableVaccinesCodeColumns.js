export async function up(query) {
  await query.renameColumn('certifiable_vaccines', 'atc_code', 'vaccine_code');
  await query.renameColumn('certifiable_vaccines', 'target_snomed_code', 'target_code');
}

export async function down(query) {
  await query.renameColumn('certifiable_vaccines', 'vaccine_code', 'atc_code');
  await query.renameColumn('certifiable_vaccines', 'target_code', 'target_snomed_code');
}
