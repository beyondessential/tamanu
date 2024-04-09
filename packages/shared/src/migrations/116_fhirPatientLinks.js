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

  await query.sequelize.query(`
    CREATE OR REPLACE PROCEDURE fhir.patients_resolve_upstream_links()
    LANGUAGE SQL
    AS $$
      WITH
        links AS (
          SELECT id, UNNEST(link) link
            FROM fhir.patients
            WHERE 'upstream://patient' = ANY(SELECT type(other(UNNEST(link))))
        ),
        downstreamed AS (
          SELECT links.id, type(links.link), other(links.link), fhir.patients.id link_id
            FROM fhir.patients
            JOIN links ON fhir.patients.upstream_id = reference(other(links.link))
        ),
        new_links AS (
          SELECT id, array_agg(
            ROW(
              ROW(
                'Patient/' || link_id,
                'Patient',
                identifier(other),
                display(other)
              )::fhir.reference,
              type
            )::fhir.patient_link
          ) new_link
            FROM downstreamed
            GROUP by id
        )
      UPDATE fhir.patients p
        SET link = n.new_link
        FROM new_links n
        WHERE p.id = n.id;
    $$
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP PROCEDURE fhir.patients_resolve_upstream_links');

  await query.sequelize.query('DROP FUNCTION patients_merge_chain_up');
  await query.sequelize.query('DROP FUNCTION patients_merge_chain_down');

  await query.sequelize.query(`
    ALTER TABLE fhir.patients
    DROP COLUMN link
  `);

  await query.sequelize.query('DROP TYPE fhir.patient_link');
}
