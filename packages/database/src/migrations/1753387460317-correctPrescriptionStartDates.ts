import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // This change also removes the default value of ''
  await query.changeColumn('prescriptions', 'start_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });

  // Set all defaulted empty string start_dates to NULL
  await query.sequelize.query(`
    UPDATE prescriptions
    SET start_date = NULL
    WHERE start_date = ''
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE prescriptions
    SET start_date = ''
    WHERE start_date IS NULL
  `);

  await query.changeColumn('prescriptions', 'start_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: false,
    defaultValue: '',
  });
}
