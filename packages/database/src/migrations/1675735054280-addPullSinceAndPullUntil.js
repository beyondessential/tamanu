import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_sessions', 'pull_since', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });
  await query.addColumn('sync_sessions', 'pull_until', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('sync_sessions', 'pull_since');
  await query.removeColumn('sync_sessions', 'pull_until');
}
