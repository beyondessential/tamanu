import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_conditions', 'resolution_date', {
    type: DataTypes.DATE,
    allowNull: true,
  });
  await query.addColumn('patient_conditions', 'resolution_practitioner', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });
  await query.addColumn('patient_conditions', 'resolution_note', {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down(query) {
  await query.removeColumn('patient_conditions', 'resolution_date');
  await query.removeColumn('patient_conditions', 'resolution_practitioner');
  await query.removeColumn('patient_conditions', 'resolution_note');
}
