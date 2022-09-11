import { QueryInterface, DataTypes } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.changeColumn('lab_tests', 'date', {
    type: DataTypes.DATETIMESTRING,
  });
}

export async function down(query: QueryInterface) {
  await query.changeColumn('lab_tests', 'date', {
    type: DataTypes.CHAR(19),
  });
}
