export async function up(query) {

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

}
