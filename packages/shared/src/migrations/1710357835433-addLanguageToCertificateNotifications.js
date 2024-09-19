import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('certificate_notifications', 'language', {
    type: Sequelize.STRING,
    defaultValue: 'en',
  });
}

export async function down(query) {
  await query.removeColumn('certificate_notifications', 'language');
}
