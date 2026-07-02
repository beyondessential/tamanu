import { QueryInterface } from 'sequelize';

// Move the secret-bearing rows out of local_system_facts and into
// local_system_secrets, so the read-only `raw` reporting role (granted SELECT on
// all of public) can no longer read the device private key or reporting secret.
// DML only — the schema change is in the preceding migration.
const SECRET_KEYS = ['deviceKey', 'reportingRoleSecret'];

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `
      INSERT INTO public.local_system_secrets (id, created_at, updated_at, deleted_at, key, value)
      SELECT id, created_at, updated_at, deleted_at, key, value
      FROM public.local_system_facts
      WHERE key IN (:keys);
    `,
    { replacements: { keys: SECRET_KEYS } },
  );
  await query.sequelize.query(`DELETE FROM public.local_system_facts WHERE key IN (:keys);`, {
    replacements: { keys: SECRET_KEYS },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `
      INSERT INTO public.local_system_facts (id, created_at, updated_at, deleted_at, key, value)
      SELECT id, created_at, updated_at, deleted_at, key, value
      FROM public.local_system_secrets
      WHERE key IN (:keys);
    `,
    { replacements: { keys: SECRET_KEYS } },
  );
  await query.sequelize.query(`DELETE FROM public.local_system_secrets WHERE key IN (:keys);`, {
    replacements: { keys: SECRET_KEYS },
  });
}
