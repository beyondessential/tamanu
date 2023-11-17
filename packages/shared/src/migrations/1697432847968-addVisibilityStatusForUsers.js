import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('users', 'visibility_status', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'current',
  });
}

export async function down(query) {
  await query.removeColumn('users', 'visibility_status');
}
