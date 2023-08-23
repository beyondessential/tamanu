import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('report_definitions', 'db_user', {
    type: Sequelize.ENUM('tamanu_dataset_reporting', 'tamanu_raw_reporting'),
    allowNull: false,
    defaultValue: 'tamanu_dataset_reporting',
  });

  await query.sequelize.query(`
    UPDATE "report_definitions"
    SET "db_user" = 'tamanu_raw_reporting'
  `);
}

export async function down(query) {
  await query.removeColumn('report_definitions', 'db_user');
}
