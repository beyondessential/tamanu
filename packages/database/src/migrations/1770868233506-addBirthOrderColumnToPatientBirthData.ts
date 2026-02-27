import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_birth_data', 'birth_order', {
    type: DataTypes.INTEGER,
    allowNull: true,
  });

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('patient_birth_data');`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_birth_data', 'birth_order');
}
