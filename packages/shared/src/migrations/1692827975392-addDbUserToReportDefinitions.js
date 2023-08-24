import Sequelize from 'sequelize';

const DB_ROLES = {
  RAW: 'tamanu_raw_reporting',
  DATASET: 'tamanu_dataset_reporting',
};

export async function up(query) {
  await query.addColumn('report_definitions', 'db_user', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: DB_ROLES.DATASET,
  });

  await query.sequelize.query(`
    UPDATE "report_definitions"
    SET "db_user" = '${DB_ROLES.RAW}'
  `);
}

export async function down(query) {
  await query.removeColumn('report_definitions', 'db_user');
}
