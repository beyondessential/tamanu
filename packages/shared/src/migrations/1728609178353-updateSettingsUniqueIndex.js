export async function up(query) {
  await query.sequelize.query(
    'alter table settings drop constraint  settings_alive_key_unique_cnt',
  );
  await query.addConstraint('settings', {
    name: 'settings_alive_key_unique_cnt',
    fields: ['key', 'facility_id'],
    type: 'UNIQUE',
  });
}

export async function down(query) {
  await query.sequelize.query(
    'alter table settings drop constraint  settings_alive_key_unique_cnt',
  );
  await query.addConstraint('settings', {
    name: 'settings_alive_key_unique_cnt',
    fields: ['key', 'facility_id', 'deleted_at'],
    type: 'UNIQUE',
  });
}
