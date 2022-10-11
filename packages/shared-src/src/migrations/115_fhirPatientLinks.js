export async function up(query) {
  await query.sequelize.query(`
    CREATE TYPE fhir.patient_link AS (
      other           fhir.reference,
      type            text
    )
  `);

  await query.sequelize.query(`
    ALTER TABLE fhir.patients
    ADD COLUMN link fhir.patient_link[] DEFAULT '{}'
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    ALTER TABLE fhir.patients
    DROP COLUMN link
  `);

  await query.sequelize.query('DROP TYPE fhir.patient_link');
}
