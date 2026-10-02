import { QueryInterface } from 'sequelize';

// spec: MFS#the-syncpatient-permission
// Grants `create SyncPatient` to every role that can read all patients, so marking patients for
// sync keeps working for everyone who could do it before the permission existed.
//
// Runs on every server rather than central only. Migrations run with the sync tick trigger
// disabled, so a row inserted here on central keeps tick 0 and would only reach facilities on an
// initial sync. Each server inserts the same rows from its own copy of `permissions` instead,
// under the id `Permission.generatePermissionId` would give them, so later changes made on
// central update these rows in place.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    INSERT INTO permissions (id, role_id, verb, noun, object_id, created_at, updated_at)
    SELECT
      lower(role_id || '-create-syncpatient-any'),
      role_id,
      'create',
      'SyncPatient',
      NULL,
      NOW(),
      NOW()
    FROM permissions
    WHERE noun = 'Patient'
      AND verb = 'read'
      AND object_id IS NULL
      AND role_id IS NOT NULL
      AND deleted_at IS NULL
    ON CONFLICT DO NOTHING;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: also removes any `create SyncPatient` grants an administrator made after upgrade
  await query.sequelize.query(`
    DELETE FROM permissions
    WHERE noun = 'SyncPatient'
      AND verb = 'create'
      AND object_id IS NULL;
  `);
}
