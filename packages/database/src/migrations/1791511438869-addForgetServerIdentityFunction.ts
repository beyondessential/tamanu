import { QueryInterface } from 'sequelize';
import { SERVER_IDENTITY_FACTS } from '@tamanu/constants';

const sqlList = (keys: string[]) => keys.map(key => `'${key}'`).join(', ');
const ENCRYPTED = `'^S1:[^:]*:[^:]*$'`;

// A copied database keeps nothing that lets it act as the server it came from: no key-encrypted
// secret, no identity fact, and no secret setting (integration credentials). It then runs under
// any key file. Secret settings are soft-deleted so the deletion syncs down to facilities.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION forget_server_identity() RETURNS void
    LANGUAGE sql
    AS $$
      DELETE FROM public.local_system_secrets;
      DELETE FROM public.local_system_facts
      WHERE key IN (${sqlList(SERVER_IDENTITY_FACTS)})
         OR value ~ ${ENCRYPTED};
      UPDATE public.settings SET deleted_at = now()
      WHERE deleted_at IS NULL
        AND jsonb_typeof(value) = 'string'
        AND value #>> '{}' ~ ${ENCRYPTED};
    $$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS forget_server_identity();`);
}
