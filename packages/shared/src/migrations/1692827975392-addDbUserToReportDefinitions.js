import Sequelize from 'sequelize';

export async function up(query) {
  await query.addColumn('report_definitions', 'db_role', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'dataset',
  });

  await query.sequelize.query(`
    UPDATE "report_definitions"
    SET "db_role" = 'raw'
  `);
}

export async function down(query) {
  await query.removeColumn('report_definitions', 'db_role');
}
