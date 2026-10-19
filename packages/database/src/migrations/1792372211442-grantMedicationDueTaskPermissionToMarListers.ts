import { QueryInterface } from 'sequelize';

// Runs on every server: rows inserted during a migration keep sync tick 0 on central and would
// never reach existing facilities, so each server inserts them under the id
// `Permission.generatePermissionId` gives, letting later central edits update them in place.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    INSERT INTO permissions (id, role_id, verb, noun, object_id, created_at, updated_at)
    SELECT
      lower(role_id || '-read-medicationduetask-any'),
      role_id,
      'read',
      'MedicationDueTask',
      NULL,
      NOW(),
      NOW()
    FROM permissions
    WHERE noun = 'MedicationAdministration'
      AND verb = 'list'
      AND object_id IS NULL
      AND role_id IS NOT NULL
      AND deleted_at IS NULL
      -- Any MedicationDueTask row, revoked ones included, means an administrator has already
      -- decided who gets these tasks, so leave that deployment alone.
      AND NOT EXISTS (SELECT 1 FROM permissions WHERE noun = 'MedicationDueTask')
    ON CONFLICT DO NOTHING;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: also removes any `read MedicationDueTask` grants an administrator made
  await query.sequelize.query(`
    DELETE FROM permissions
    WHERE noun = 'MedicationDueTask'
      AND verb = 'read'
      AND object_id IS NULL;
  `);
}
