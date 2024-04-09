import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('permissions', 'deletion_status', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('permissions', 'deletion_status');
}
