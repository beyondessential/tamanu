import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('sync_sessions', 'debug_info', {
    type: Sequelize.JSON,
  });
}

export async function down(query) {
  await query.removeColumn('sync_sessions', 'debug_info');
}
