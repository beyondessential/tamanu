import { Op } from 'sequelize';

export async function up(query) {
  // Delete all but the most recent setting for each (key, facility_id).
  // This is to get rid of duplicated data from the prior settings update code.
  await query.sequelize.query(`
    UPDATE settings
    SET deleted_at = current_timestamp(3)
    WHERE id NOT IN (
      SELECT (array_agg(id))[1]
      FROM (
        SELECT * FROM settings
        WHERE deleted_at IS NULL
        ORDER BY key ASC, facility_id ASC, updated_at DESC
      ) t
      GROUP BY key, facility_id
    );
  `);

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
