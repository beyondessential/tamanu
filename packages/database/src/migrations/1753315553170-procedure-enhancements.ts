import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('procedures', 'department_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id',
    },
  });

  await query.addColumn('procedures', 'assistant_anaesthetist_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });

  await query.addColumn('procedures', 'time_in', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });

  await query.addColumn('procedures', 'time_out', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // Remove the added columns in reverse order
  await query.removeColumn('procedures', 'time_out');
  await query.removeColumn('procedures', 'time_in');
  await query.removeColumn('procedures', 'assistant_anaesthetist_id');
  await query.removeColumn('procedures', 'department_id');
}
