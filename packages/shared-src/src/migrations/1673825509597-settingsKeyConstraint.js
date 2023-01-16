import { Op } from 'sequelize';

export async function up(query) {
  await query.addIndex('settings', ['key', 'facility_id'], {
    name: 'settings_alive_key_unique',
    unique: 'true',
    where: { deleted_at: { [Op.not]: null } },
  });
}

export async function down(query) {
  await query.removeIndex('settings', 'settings_alive_key_unique');
}
