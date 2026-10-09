import { QueryInterface } from 'sequelize';
import { SERVER_IDENTITY_FACTS, SERVER_IDENTITY_SECRETS } from '@tamanu/constants';

const sqlList = (keys: string[]) => keys.map(key => `'${key}'`).join(', ');

// A copied database stops syncing or reporting as the server it came from once these are
// gone. Other secrets stay, so a copy holding the source's key keeps its secret settings.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION forget_server_identity() RETURNS void
    LANGUAGE sql
    AS $$
      DELETE FROM public.local_system_facts WHERE key IN (${sqlList(SERVER_IDENTITY_FACTS)});
      DELETE FROM public.local_system_secrets WHERE key IN (${sqlList(SERVER_IDENTITY_SECRETS)});
    $$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS forget_server_identity();`);
}
