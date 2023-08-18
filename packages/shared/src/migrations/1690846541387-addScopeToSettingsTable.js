import { DataTypes } from 'sequelize';
import { SETTINGS_SCOPES } from '@tamanu/constants/settings';

export async function up(query) {
  await query.addColumn('settings', 'scope', {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: SETTINGS_SCOPES.GLOBAL,
  });
}

export async function down(query) {
  await query.removeColumn('settings', 'scope');
}
