import { QueryInterface } from 'sequelize';

const ENCRYPTED = `'^S1:[^:]*:[^:]*$'`;

// A copied database keeps nothing that lets it act as the server it came from: no key-encrypted
// secret, no identity fact (SERVER_IDENTITY_FACTS), and no secret setting (integration
// credentials). It then runs under any key file. Secret settings are soft-deleted so the deletion
// syncs down to facilities.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION public.forget_server_identity() RETURNS void
    LANGUAGE sql
    AS $$
      DELETE FROM public.local_system_secrets;
      DELETE FROM public.local_system_facts
      WHERE key IN ('syncHost', 'syncEmail', 'facilityIds', 'deviceId', 'metaServerId')
         OR value ~ ${ENCRYPTED};
      UPDATE public.settings SET deleted_at = now()
      WHERE deleted_at IS NULL
        AND jsonb_typeof(value) = 'string'
        AND value #>> '{}' ~ ${ENCRYPTED};
    $$;
    REVOKE EXECUTE ON FUNCTION public.forget_server_identity() FROM PUBLIC;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS public.forget_server_identity();`);
}
