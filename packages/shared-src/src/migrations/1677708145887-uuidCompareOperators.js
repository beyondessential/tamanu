export async function up(query) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION op_uuid_eq_varchar(lvalue uuid, rvalue varchar)
    RETURNS boolean
    LANGUAGE SQL
    IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT lvalue::varchar = rvalue
    $$;

    CREATE OR REPLACE FUNCTION op_uuid_ne_varchar(lvalue uuid, rvalue varchar)
    RETURNS boolean
    LANGUAGE SQL
    IMMUTABLE PARALLEL SAFE
    AS $$
      SELECT lvalue::varchar <> rvalue
    $$;
  `);

  await query.sequelize.query(`
    CREATE OPERATOR = (
      FUNCTION = op_uuid_eq_varchar,
      LEFTARG = uuid,
      RIGHTARG = varchar,
      NEGATOR = <>,
      RESTRICT = eqsel,
      JOIN = eqjoinsel,
      HASHES, MERGES
    );

    CREATE OPERATOR <> (
      FUNCTION = op_uuid_ne_varchar,
      LEFTARG = uuid,
      RIGHTARG = varchar,
      NEGATOR = =,
      RESTRICT = eqsel,
      JOIN = eqjoinsel,
      HASHES, MERGES
    );
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    DROP OPERATOR = (uuid, varchar);
    DROP OPERATOR <> (uuid, varchar);
  `);

  await query.sequelize.query(`
    DROP FUNCTION op_uuid_eq_varchar;
    DROP FUNCTION op_uuid_ne_varchar;
  `);
}
