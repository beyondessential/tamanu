import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('permissions', 'deletion_status', {
    type: Sequelize.STRING,
    defaultValue: 'current',
  });
}

export async function down(query) {
  await query.removeColumn('permissions', 'deletion_status');
}
