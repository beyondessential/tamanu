import { DataTypes } from 'sequelize';

export async function up(query) {
  await query.addColumn('patient_allergies', 'reaction_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await query.addConstraint('patient_allergies', {
    fields: ['reaction_id'],
    type: 'foreign key',
    references: {
      table: 'reference_data',
      field: 'id',
    },
  });
}

export async function down(query) {
  await query.removeColumn('patient_allergies', 'reaction_id');
}
