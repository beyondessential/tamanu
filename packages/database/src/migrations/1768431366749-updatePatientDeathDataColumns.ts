import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn('patient_death_data', 'autopsy_requested', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn('patient_death_data', 'autopsy_findings_used', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn('patient_death_data', 'manner_of_death_description', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  await query.addColumn('patient_death_data', 'pregnancy_moment', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn('patient_death_data', 'multiple_pregnancy', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn('patient_death_data', 'mother_condition_description', {
    type: DataTypes.TEXT,
    allowNull: true,
  });
  
  await query.removeColumn('patient_death_data', 'carrier_existing_condition_id');
  
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('patient_death_data');`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.removeColumn('patient_death_data', 'autopsy_requested');
  await query.removeColumn('patient_death_data', 'autopsy_findings_used');
  await query.removeColumn('patient_death_data', 'manner_of_death_description');
  await query.removeColumn('patient_death_data', 'pregnancy_moment');
  await query.removeColumn('patient_death_data', 'multiple_pregnancy');
  await query.removeColumn('patient_death_data', 'mother_condition_description');

  await query.addColumn('patient_death_data', 'carrier_existing_condition_id', {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'reference_data',
      key: 'id',
    },
  });

  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('patient_death_data');`);
}
