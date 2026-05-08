import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('users', 'display_id', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('users', 'display_id');
}
