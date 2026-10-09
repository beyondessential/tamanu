import { QueryInterface } from 'sequelize';
import { SERVER_IDENTITY_FACTS } from '@tamanu/constants';

const sqlList = (keys: string[]) => keys.map(key => `'${key}'`).join(', ');

// A database runs under a different key file only once it has forgotten the server it came
// from: every value the old key encrypted, and the plaintext facts that would still point
// it at that server's central.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION forget_server_identity() RETURNS void
    LANGUAGE sql
    AS $$
      DELETE FROM public.local_system_secrets;
      DELETE FROM public.local_system_facts
      WHERE key IN (${sqlList(SERVER_IDENTITY_FACTS)})
         OR value ~ '^S1:[^:]*:[^:]*$';
    $$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS forget_server_identity();`);
}
