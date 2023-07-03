export async function up(query) {
  await query.sequelize.query(`
    CREATE TYPE fhir.annotation AS (
      authorReference fhir.reference,
      authorString    text,
      time            timestamptz,
      text            text
    );

    COMMENT ON TYPE fhir.annotation IS 'The text field of the annotation is required, and the author fields are mutually exclusive, but this is enforced in the application layer.';
  `);
}

export async function down(query) {
  await query.sequelize.query(`DROP TYPE fhir.annotation`);
}
