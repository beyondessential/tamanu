import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.changeColumn('administered_vaccines', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query) {
  const UNKNOWN_DATE = '1990-01-01 00:00:00';
  await query.sequelize.query(`
    UPDATE administered_vaccines
    SET date = '${UNKNOWN_DATE}'
    WHERE date IS NULL
  `);
  await query.changeColumn('administered_vaccines', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });
}
