import { QueryInterface } from 'sequelize';
import {
  FACT_CENTRAL_HOST,
  FACT_DEVICE_ID,
  FACT_DEVICE_KEY,
  FACT_FACILITY_IDS,
  FACT_META_SERVER_ID,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
} from '@tamanu/constants';

// Database clones (replicas, restores) call this to stop the copy syncing or reporting status
// as the server it was cloned from. Keep it in step with the facts that identify a server.
const IDENTITY_FACTS = [
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_FACILITY_IDS,
  FACT_DEVICE_ID,
  FACT_META_SERVER_ID,
];
const IDENTITY_SECRETS = [FACT_SYNC_PASSWORD, FACT_DEVICE_KEY];

const sqlList = (keys: string[]) => keys.map(key => `'${key}'`).join(', ');

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION forget_server_identity() RETURNS void
    LANGUAGE sql
    AS $$
      DELETE FROM public.local_system_facts WHERE key IN (${sqlList(IDENTITY_FACTS)});
      DELETE FROM public.local_system_secrets WHERE key IN (${sqlList(IDENTITY_SECRETS)});
    $$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS forget_server_identity();`);
}
