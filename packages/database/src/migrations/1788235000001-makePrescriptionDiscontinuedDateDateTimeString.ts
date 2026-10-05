import { DataTypes, QueryInterface } from 'sequelize';

// Migration 2 of 2: Change the column type (DDL)
// Separated from the data normalisation to avoid "pending trigger events" error
//
// prescriptions.discontinued_date was declared DataTypes.STRING while every other date on the
// model uses dateTimeType, so it was created as varchar(255) and gets none of the normalisation
// the setter provides. Bring it onto the date_time_string domain like date, start_date and
// end_date, which is also what the mobile model already declares it as.

export async function up(query: QueryInterface): Promise<void> {
  await query.changeColumn('prescriptions', 'discontinued_date', {
    type: DataTypes.DATETIMESTRING,
    allowNull: true,
  });
}

export async function down(query: QueryInterface): Promise<void> {
  // Widening back to varchar(255) always succeeds, but the values the previous migration
  // normalised or cleared are not recoverable.
  await query.changeColumn('prescriptions', 'discontinued_date', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}
