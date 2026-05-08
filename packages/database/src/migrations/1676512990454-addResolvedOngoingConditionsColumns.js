import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_conditions', 'resolution_date', {
    type: 'date_time_string',
    allowNull: true,
  });
  await query.addColumn('patient_conditions', 'resolution_practitioner_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  });
  await query.addColumn('patient_conditions', 'resolution_note', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('patient_conditions', 'resolution_date');
  await query.removeColumn('patient_conditions', 'resolution_practitioner_id');
  await query.removeColumn('patient_conditions', 'resolution_note');
}
