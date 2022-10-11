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

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION patients_merge_chain_up(id varchar)
    RETURNS varchar[]
    LANGUAGE SQL
    STABLE PARALLEL SAFE
    AS $$
      WITH RECURSIVE chain(from_id, to_id) AS (
        SELECT id, NULL::varchar
        UNION
        SELECT patients.merged_into_id, chain.from_id
          FROM chain
          LEFT OUTER JOIN patients
          ON patients.id = from_id
          WHERE chain.from_id IS NOT NULL
      )
      SELECT array_agg(to_id)
        FROM chain
        WHERE to_id IS NOT NULL
    $$
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION patients_merge_chain_down(id varchar)
    RETURNS varchar[]
    LANGUAGE SQL
    STABLE PARALLEL SAFE
    AS $$
      WITH RECURSIVE chain(from_id, to_id) AS (
        SELECT NULL::varchar, id
        UNION
        SELECT chain.to_id, patients.id
          FROM chain
          LEFT OUTER JOIN patients
          ON patients.merged_into_id = to_id
          WHERE chain.to_id IS NOT NULL
      )
      SELECT array_agg(from_id)
        FROM chain
        WHERE from_id IS NOT NULL
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP FUNCTION patients_merge_chain_up');
  await query.sequelize.query('DROP FUNCTION patients_merge_chain_down');

  await query.sequelize.query(`
    ALTER TABLE fhir.patients
    DROP COLUMN link
  `);

  await query.sequelize.query('DROP TYPE fhir.patient_link');
}
