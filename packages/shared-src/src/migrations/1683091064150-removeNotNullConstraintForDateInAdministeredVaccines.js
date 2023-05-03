import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.changeColumn('administered_vaccines', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.bulkDelete('administered_vaccines', { date: null });
  await query.changeColumn('administered_vaccines', 'date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });
}
