export async function up(query) {
  await query.sequelize.query(
    `CREATE INDEX IF NOT EXISTS patients_merged_into_id ON patients (merged_into_id)`,
  );
}

export async function down(query) {
  await query.removeIndex('patients', 'patients_merged_into_id');
}
