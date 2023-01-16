import { Op } from 'sequelize';

export async function up(query) {
  // Constraint is overly broad (includes deleted_at), but we can't add a partial unique constraint,
  // so we enforce it with the second unique index (the first being implied by the constraint).
  await query.addConstraint('settings', {
    name: 'settings_alive_key_unique_cnt',
    fields: ['key', 'facility_id', 'deleted_at'],
    type: 'UNIQUE',
  });
  await query.addIndex('settings', {
    name: 'settings_alive_key_unique_idx',
    fields: ['key', 'facility_id'],
    unique: true,
    where: { deleted_at: { [Op.not]: null } },
  });
}

export async function down(query) {
  await query.removeIndex('settings', 'settings_alive_key_unique_idx');
  await query.removeConstraint('settings', 'settings_alive_key_unique_cnt');
}
