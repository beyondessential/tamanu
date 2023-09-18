import Sequelize from 'sequelize';
import config from 'config';

const { reportingRoles } = config.db;

if (!reportingRoles || !reportingRoles.raw || !reportingRoles.dataset) {
  throw Error(
    'A dataset and raw reporting role must be configured in local.json for this migration to run.',
  );
}

export async function up(query) {
  await query.addColumn('report_definitions', 'db_role', {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: reportingRoles.dataset,
  });

  await query.sequelize.query(`
    UPDATE "report_definitions"
    SET "db_role" = '${reportingRoles.raw}'
  `);
}

export async function down(query) {
  await query.removeColumn('report_definitions', 'db_role');
}
