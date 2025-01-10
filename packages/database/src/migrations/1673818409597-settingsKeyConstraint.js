export async function up(query) {
  // Delete all but the most recent setting for each (key, facility_id).
  // This is to get rid of duplicated data from the prior settings update code.
  await query.sequelize.query(`
    UPDATE settings
    SET deleted_at = current_timestamp(3)
    WHERE id NOT IN (
      SELECT first(id)
      FROM (
        SELECT * FROM settings
        WHERE deleted_at IS NULL
        ORDER BY key ASC, facility_id ASC, updated_at DESC
      ) t
      GROUP BY key, facility_id
    );
  `);

  // Constraint is overly broad (includes deleted_at), but we can't add a partial unique constraint, so
  // we enforce it with the second and third unique indices (the first being implied by the constraint).
  // That's a lot of indices but settings are write-seldom read-often so it's an acceptable tradeoff.
  await query.addConstraint('settings', {
    name: 'settings_alive_key_unique_cnt',
    fields: ['key', 'facility_id', 'deleted_at'],
    type: 'UNIQUE',
  });
  await query.sequelize.query(`
    CREATE UNIQUE INDEX settings_alive_key_unique_with_facility_idx
    ON settings (key, facility_id)
    WHERE facility_id IS NOT NULL AND deleted_at IS NULL
  `);
  await query.sequelize.query(`
    CREATE UNIQUE INDEX settings_alive_key_unique_without_facility_idx
    ON settings (key)
    WHERE facility_id IS NULL AND deleted_at IS NULL
  `);
}

export async function down(query) {
  await query.removeIndex('settings', 'settings_alive_key_unique_without_facility_idx');
  await query.removeIndex('settings', 'settings_alive_key_unique_with_facility_idx');
  await query.removeConstraint('settings', 'settings_alive_key_unique_cnt');
}
