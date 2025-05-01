import type { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION local_system_fact(the_key text, the_default text)
    RETURNS NULL ON NULL INPUT
    RETURNS text AS $$
      DECLARE
        the_value text;
      BEGIN
        SELECT value INTO the_value
        FROM local_system_facts WHERE key = the_key;
        IF NOT FOUND THEN
          the_value = the_default;
        END IF;
        RETURN the_value;
      END;
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;
  `);
}

export async function down(query: QueryInterface) {
  await query.sequelize.query('DROP FUNCTION local_system_fact CASCADE');
}