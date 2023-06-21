export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.op_inverse_regex(regex text, value text)
    RETURNS boolean
    LANGUAGE SQL
    IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT value ~ regex
    $$
  `);
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.op_inverse_not_regex(regex text, value text)
    RETURNS boolean
    LANGUAGE SQL
    IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT value !~ regex
    $$
  `);
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.op_inverse_regexi(regex text, value text)
    RETURNS boolean
    LANGUAGE SQL
    IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT value ~* regex
    $$
  `);
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION fhir.op_inverse_not_regexi(regex text, value text)
    RETURNS boolean
    LANGUAGE SQL
    IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT value !~* regex
    $$
  `);

  await query.sequelize.query(`
    CREATE OPERATOR fhir.<~ (
      FUNCTION = fhir.op_inverse_regex,
      LEFTARG = text,
      RIGHTARG = text,
      NEGATOR = OPERATOR(fhir.<!~),
      RESTRICT = eqsel
    );
  `);
  await query.sequelize.query(`
    CREATE OPERATOR fhir.<!~ (
      FUNCTION = fhir.op_inverse_not_regex,
      LEFTARG = text,
      RIGHTARG = text,
      NEGATOR = OPERATOR(fhir.<~),
      RESTRICT = neqsel
    );
  `);
  await query.sequelize.query(`
    CREATE OPERATOR fhir.<~* (
      FUNCTION = fhir.op_inverse_regexi,
      LEFTARG = text,
      RIGHTARG = text,
      NEGATOR = OPERATOR(fhir.<!~*),
      RESTRICT = eqsel
    );
  `);
  await query.sequelize.query(`
    CREATE OPERATOR fhir.<!~* (
      FUNCTION = fhir.op_inverse_not_regexi,
      LEFTARG = text,
      RIGHTARG = text,
      NEGATOR = OPERATOR(fhir.<~*),
      RESTRICT = neqsel
    );
  `);
}

export async function down(query) {
  await query.sequelize.query('DROP OPERATOR fhir.<!~* (text, text)');
  await query.sequelize.query('DROP OPERATOR fhir.<~* (text, text)');
  await query.sequelize.query('DROP OPERATOR fhir.<!~ (text, text)');
  await query.sequelize.query('DROP OPERATOR fhir.<~ (text, text)');

  await query.sequelize.query('DROP FUNCTION fhir.op_inverse_regex');
  await query.sequelize.query('DROP FUNCTION fhir.op_inverse_not_regex');
  await query.sequelize.query('DROP FUNCTION fhir.op_inverse_regexi');
  await query.sequelize.query('DROP FUNCTION fhir.op_inverse_not_regexi');
}
