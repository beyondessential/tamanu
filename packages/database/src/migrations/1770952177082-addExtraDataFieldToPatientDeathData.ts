import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_death_data', 'extra_data', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('patient_death_data');`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_death_data', 'extra_data');
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('patient_death_data');`);
}
