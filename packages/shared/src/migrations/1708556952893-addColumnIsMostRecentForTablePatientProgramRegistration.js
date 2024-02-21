import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_program_registrations', 'is_most_recent', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}

export async function down(query) {
  await query.removeColumn('users', 'is_most_recent');
}
