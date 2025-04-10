import type { QueryInterface } from 'sequelize';
import { FACT_TIME_OFFSET } from '@tamanu/constants';

export async function up(query: QueryInterface) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION adjusted_offset()
    RETURNS interval AS $$
      DECLARE
        the_offset interval;
      BEGIN
        SELECT value::int8 * '1 microsecond'::interval INTO the_offset
        FROM local_system_facts WHERE key = '${FACT_TIME_OFFSET}';
        IF NOT FOUND THEN
          the_offset = '0 microseconds'::interval;
        END IF;
        RETURN the_offset;
      END;
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;
  `);
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION adjusted_timestamp()
    RETURNS timestamptz AS $$
      BEGIN
        RETURN current_timestamp + adjusted_offset();
      END;
    $$ LANGUAGE plpgsql STABLE PARALLEL SAFE;
  `);
}

export async function down(query: QueryInterface) {
  await query.sequelize.query('DROP FUNCTION adjusted_timestamp');
  await query.sequelize.query('DROP FUNCTION adjusted_offset');
}
