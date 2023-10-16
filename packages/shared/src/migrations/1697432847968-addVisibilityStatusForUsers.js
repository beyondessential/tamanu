import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('users', 'visibility_status', {
    type: Sequelize.STRING,
    defaultValue: 'current',
  });
  // write your up migration here
}

export async function down(query) {
  await query.removeColumn('users', 'visibility_status');
}
