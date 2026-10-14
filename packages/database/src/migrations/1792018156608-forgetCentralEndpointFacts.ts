import { QueryInterface } from 'sequelize';

const ENCRYPTED = `'^S1:[^:]*:[^:]*$'`;

// forget_server_identity() deletes SERVER_IDENTITY_FACTS, which now include the recorded central
// endpoints and the one in use. A copy that kept them would sync to the endpoints of the server it
// came from rather than the central it is set up against, since the recorded list takes precedence
// over the host the wizard records. Otherwise the same as the function it replaces.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION public.forget_server_identity() RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF current_setting('tamanu.this_is_a_copy', true) IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'forget_server_identity() deletes this server''s identity and secrets, so it only runs on a copy'
          USING HINT = 'On a copy, run SELECT set_config(''tamanu.this_is_a_copy'', ''true'', true); in the same transaction first. Never on the server it was copied from.';
      END IF;
      DELETE FROM public.local_system_secrets;
      DELETE FROM public.local_system_facts
      WHERE key IN ('syncHost', 'syncCentralEndpoints', 'syncCentralEndpointInUse', 'syncEmail', 'facilityIds', 'deviceId', 'metaServerId')
         OR value ~ ${ENCRYPTED};
      UPDATE public.settings SET deleted_at = now()
      WHERE deleted_at IS NULL
        AND jsonb_typeof(value) = 'string'
        AND value #>> '{}' ~ ${ENCRYPTED};
    END;
    $$;
    REVOKE EXECUTE ON FUNCTION public.forget_server_identity() FROM PUBLIC;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: restores the previous function, which leaves the recorded central endpoints in
  // place on a copy.
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION public.forget_server_identity() RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF current_setting('tamanu.this_is_a_copy', true) IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'forget_server_identity() deletes this server''s identity and secrets, so it only runs on a copy'
          USING HINT = 'On a copy, run SELECT set_config(''tamanu.this_is_a_copy'', ''true'', true); in the same transaction first. Never on the server it was copied from.';
      END IF;
      DELETE FROM public.local_system_secrets;
      DELETE FROM public.local_system_facts
      WHERE key IN ('syncHost', 'syncEmail', 'facilityIds', 'deviceId', 'metaServerId')
         OR value ~ ${ENCRYPTED};
      UPDATE public.settings SET deleted_at = now()
      WHERE deleted_at IS NULL
        AND jsonb_typeof(value) = 'string'
        AND value #>> '{}' ~ ${ENCRYPTED};
    END;
    $$;
    REVOKE EXECUTE ON FUNCTION public.forget_server_identity() FROM PUBLIC;
  `);
}
