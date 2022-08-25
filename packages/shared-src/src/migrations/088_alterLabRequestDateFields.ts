import { QueryInterface, DataTypes } from 'sequelize';

export async function up(query: QueryInterface) {
  await query.changeColumn('lab_requests', 'sample_time', {
    type: DataTypes.DATETIMESTRING,
  });
  await query.changeColumn('lab_requests', 'requested_date', {
    type: DataTypes.DATETIMESTRING,
  });
}

export async function down(query: QueryInterface) {
  await query.changeColumn('lab_requests', 'sample_time', {
    type: DataTypes.CHAR(19),
  });
  await query.changeColumn('lab_requests', 'requested_date', {
    type: DataTypes.CHAR(19),
  });
}
