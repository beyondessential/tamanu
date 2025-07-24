import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  query.changeColumn('prescriptions', 'start_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  query.changeColumn('prescriptions', 'start_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
    defaultValue: '',
  });
}
