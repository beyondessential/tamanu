import { QueryInterface, DataTypes } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.changeColumn('appointments', 'start_time', {
    type: DataTypes.DATETIMESTRING,
  });
  await query.changeColumn('appointments', 'end_time', {
    type: DataTypes.DATETIMESTRING,
  });
}

export async function down(query: QueryInterface) {
  await query.changeColumn('appointments', 'start_time', {
    type: DataTypes.CHAR(19),
  });
  await query.changeColumn('appointments', 'end_time', {
    type: DataTypes.CHAR(19),
  });
}
