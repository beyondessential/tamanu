import type { QueryInterface } from 'sequelize';
import { FACT_TIME_OFFSET } from '@tamanu/constants';

export async function up(query: QueryInterface) {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION adjusted_offset()
    RETURNS interval AS $$
      BEGIN
        RETURN local_system_fact('${FACT_TIME_OFFSET}', '0 microseconds')::interval;
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
  await query.sequelize.query('DROP FUNCTION adjusted_timestamp CASCADE');
  await query.sequelize.query('DROP FUNCTION adjusted_offset CASCADE');
}
