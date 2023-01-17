export async function up(query) {
  // Aggregate that returns the first non-NULL value.
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION first_agg (anyelement, anyelement)
      RETURNS anyelement
      RETURNS NULL ON NULL INPUT
      IMMUTABLE PARALLEL SAFE
      LANGUAGE SQL
      AS 'SELECT $1';

    CREATE AGGREGATE first (anyelement) (
      SFUNC    = first_agg,
      STYPE    = anyelement,
      PARALLEL = safe
    );
  `);

  // Aggregate that returns the last non-NULL value.
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION last_agg (anyelement, anyelement)
      RETURNS anyelement
      RETURNS NULL ON NULL INPUT
      IMMUTABLE PARALLEL SAFE
      LANGUAGE SQL
      AS 'SELECT $2';

    CREATE AGGREGATE last (anyelement) (
      SFUNC    = last_agg,
      STYPE    = anyelement,
      PARALLEL = safe
    );
  `);
}

export async function down(query) {
  await query.sequelize.query(`DROP AGGREGATE IF EXISTS first(anyelement)`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS first_agg(anyelement, anyelement)`);
  await query.sequelize.query(`DROP AGGREGATE IF EXISTS last(anyelement)`);
  await query.sequelize.query(`DROP FUNCTION IF EXISTS last_agg(anyelement, anyelement)`);
}
