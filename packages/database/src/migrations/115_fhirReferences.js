export async function up(query) {
  // a Reference's identifier is an Identifier, but we cannot have circular
  // types in postgres composites, so we break rank a little and specify that
  // a fhir.reference's identifier is JSON data instead. That way we can support
  // it if needed but also let's hope we don't have to.
  await query.sequelize.query(`
    CREATE TYPE fhir.reference AS (
      reference       text,
      type            text,
      identifier      jsonb,
      display         text
    )
  `);

  await query.sequelize.query(`
    CREATE TYPE fhir.new_identifier AS (
      use             text,
      type            fhir.codeable_concept,
      system          text,
      value           text,
      period          fhir.period,
      assigner        fhir.reference
    )
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.migrate_identifier(
      IN oldids fhir.identifier[],
      OUT newids fhir.new_identifier[]
    )
    RETURNS fhir.new_identifier[] LANGUAGE plpgsql
    IMMUTABLE PARALLEL SAFE RETURNS NULL ON NULL INPUT
    AS $migrate$
      DECLARE
        old fhir.identifier;
      BEGIN
        FOREACH old IN ARRAY oldids LOOP
          newids := newids || ARRAY[ROW(
            old.use,
            old.type,
            old.system,
            old.value,
            old.period,
            ROW(null, null, null, old.assigner)
          )::fhir.new_identifier];
        END LOOP;
      END;
    $migrate$
  `);

  await query.sequelize.query(`
    ALTER TABLE fhir.patients
    ALTER COLUMN identifier DROP DEFAULT,
    ALTER COLUMN identifier TYPE fhir.new_identifier[]
    USING fhir.migrate_identifier(identifier),
    ALTER COLUMN identifier SET DEFAULT '{}'
  `);

  await query.sequelize.query(`
    ALTER TABLE fhir.practitioners
    ALTER COLUMN identifier DROP DEFAULT,
    ALTER COLUMN identifier TYPE fhir.new_identifier[]
    USING fhir.migrate_identifier(identifier),
    ALTER COLUMN identifier SET DEFAULT '{}'
  `);

  await query.sequelize.query(`
    ALTER TABLE fhir.service_requests
    ALTER COLUMN identifier DROP DEFAULT,
    ALTER COLUMN identifier TYPE fhir.new_identifier[]
    USING fhir.migrate_identifier(identifier),
    ALTER COLUMN identifier SET DEFAULT '{}'
  `);

  await query.sequelize.query(`DROP FUNCTION fhir.migrate_identifier`);
  await query.sequelize.query(`DROP TYPE fhir.identifier`);
  await query.sequelize.query(`ALTER TYPE fhir.new_identifier RENAME TO identifier`);
}

export async function down(query) {
  await query.sequelize.query(`
    CREATE TYPE fhir.old_identifier AS (
      use             text,
      type            fhir.codeable_concept,
      system          text,
      value           text,
      period          fhir.period,
      assigner        text
    )
  `);

  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.migrate_identifier(
      IN newids fhir.identifier[],
      OUT oldids fhir.old_identifier[]
    )
    RETURNS fhir.old_identifier[] LANGUAGE plpgsql
    IMMUTABLE PARALLEL SAFE RETURNS NULL ON NULL INPUT
    AS $migrate$
      DECLARE
        new fhir.identifier;
      BEGIN
        FOREACH new IN ARRAY newids LOOP
          oldids := oldids || ARRAY[ROW(
            new.use,
            new.type,
            new.system,
            new.value,
            new.period,
            ((new).assigner).display
          )::fhir.old_identifier];
        END LOOP;
      END;
    $migrate$
  `);

  await query.sequelize.query(`
    ALTER TABLE fhir.patients
    ALTER COLUMN identifier DROP DEFAULT,
    ALTER COLUMN identifier TYPE fhir.old_identifier[]
    USING fhir.migrate_identifier(identifier),
    ALTER COLUMN identifier SET DEFAULT '{}'
  `);

  await query.sequelize.query(`
    ALTER TABLE fhir.practitioners
    ALTER COLUMN identifier DROP DEFAULT,
    ALTER COLUMN identifier TYPE fhir.old_identifier[]
    USING fhir.migrate_identifier(identifier),
    ALTER COLUMN identifier SET DEFAULT '{}'
  `);

  await query.sequelize.query(`
    ALTER TABLE fhir.service_requests
    ALTER COLUMN identifier DROP DEFAULT,
    ALTER COLUMN identifier TYPE fhir.old_identifier[]
    USING fhir.migrate_identifier(identifier),
    ALTER COLUMN identifier SET DEFAULT '{}'
  `);

  await query.sequelize.query(`DROP FUNCTION fhir.migrate_identifier`);
  await query.sequelize.query(`DROP TYPE fhir.identifier`);
  await query.sequelize.query(`ALTER TYPE fhir.old_identifier RENAME TO identifier`);

  await query.sequelize.query('DROP TYPE fhir.reference');
}
