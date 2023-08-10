import { SETTINGS_SCOPES } from '../constants';

export async function up(query) {
  // Drop indexes from settings table
  await query.removeIndex('settings', 'settings_alive_key_unique_without_facility_idx');
  await query.removeIndex('settings', 'settings_alive_key_unique_with_facility_idx');
  await query.removeConstraint('settings', 'settings_alive_key_unique_cnt');

  // Constraint is overly broad (includes deleted_at), but we can't add a partial unique constraint, so
  // we enforce it with the second and third unique indices (the first being implied by the constraint).
  // That's a lot of indices but settings are write-seldom read-often so it's an acceptable tradeoff.
  await query.addConstraint('settings', {
    name: 'settings_alive_key_unique_cnt',
    fields: ['key', 'facility_id', 'scope', 'deleted_at'],
    type: 'UNIQUE',
  });
  await query.sequelize.query(`
    CREATE UNIQUE INDEX settings_alive_key_unique_with_facility_idx
    ON settings (key, facility_id, scope)
    WHERE facility_id IS NOT NULL AND deleted_at IS NULL
  `);
  await query.sequelize.query(`
    CREATE UNIQUE INDEX settings_alive_key_unique_without_facility_idx
    ON settings (key, scope)
    WHERE facility_id IS NULL AND deleted_at IS NULL
  `);

  await query.sequelize.query(`
    ALTER TABLE settings ADD CONSTRAINT check_facility_id CHECK (
      (scope = '${SETTINGS_SCOPES.FACILITY}' AND facility_id IS NOT NULL) OR
      (scope <> '${SETTINGS_SCOPES.FACILITY}' AND facility_id IS NULL))s`);
}

export async function down(query) {}
