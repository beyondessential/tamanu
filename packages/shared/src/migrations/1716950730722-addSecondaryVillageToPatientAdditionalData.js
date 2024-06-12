import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_additional_data', 'secondary_village_id', {
    type: DataTypes.TEXT,
    references: {
      model: 'reference_data',
      key: 'id',
    },
    allowNull: true,
  });
  await query.addIndex('patient_additional_data', ['secondary_village_id']);
}

export async function down(query) {
  await query.removeColumn('patient_additional_data', 'secondary_village_id');
}
