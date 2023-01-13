import { DataTypes } from 'sequelize';

const ISO9075_DATE_TIME_FMT = 'YYYY-MM-DD HH24:MI:SS';

export async function up(query) {
  await query.addColumn('imaging_results', 'completed_at', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
  await query.sequelize.query(`
    UPDATE imaging_results
    SET completed_at = TO_CHAR(created_at, '${ISO9075_DATE_TIME_FMT}')
  `);
  await query.changeColumn('imaging_results', 'completed_at', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });
}

export async function down(query) {
  await query.removeColumn('imaging_results', 'completed_at');
}
