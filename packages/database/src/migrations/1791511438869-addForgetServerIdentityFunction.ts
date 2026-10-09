import { QueryInterface } from 'sequelize';
import {
  FACT_CENTRAL_HOST,
  FACT_DEVICE_ID,
  FACT_FACILITY_IDS,
  FACT_META_SERVER_ID,
  FACT_SYNC_EMAIL,
} from '@tamanu/constants';

// A database runs under a different key file only once it has forgotten the server it came
// from: every value the old key encrypted, and the plaintext facts that would still point
// it at that server's central. Keep the list in step with the facts that identify a server.
const IDENTITY_FACTS = [
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_FACILITY_IDS,
  FACT_DEVICE_ID,
  FACT_META_SERVER_ID,
];

const sqlList = (keys: string[]) => keys.map(key => `'${key}'`).join(', ');

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    CREATE OR REPLACE FUNCTION forget_server_identity() RETURNS void
    LANGUAGE sql
    AS $$
      DELETE FROM public.local_system_secrets;
      DELETE FROM public.local_system_facts
      WHERE key IN (${sqlList(IDENTITY_FACTS)})
         OR value ~ '^S1:[^:]*:[^:]*$';
    $$;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP FUNCTION IF EXISTS forget_server_identity();`);
}
