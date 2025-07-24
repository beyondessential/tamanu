import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Set all defaulted empty string start_dates to NULL
  await query.sequelize.query(`
    UPDATE prescriptions
    SET start_date = date
    WHERE start_date = ''
  `);
  // This change also removes the default value of ''
  await query.changeColumn('prescriptions', 'start_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.changeColumn('prescriptions', 'start_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
    defaultValue: '',
  });
}
