import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_sessions', 'start_since', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('sync_sessions', 'start_since');
}
