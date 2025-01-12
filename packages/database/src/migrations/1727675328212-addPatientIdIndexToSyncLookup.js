export async function up(query) {
  await query.sequelize.query(`
    CREATE INDEX IF NOT EXISTS
      sync_lookup_patient_id
    ON
      sync_lookup (patient_id)
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    DROP INDEX
      sync_lookup_patient_id
  `);
}
