import { DataTypes, QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Add the new column with foreign key constraint
  await query.addColumn(
    'patient_program_registration_conditions',
    'patient_program_registration_id',
    {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'patient_program_registrations',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  );

  // Add index for the new column
  await query.addIndex('patient_program_registration_conditions', [
    'patient_program_registration_id',
  ]);

  // Update all conditions to link to their most recent program registration
  await query.sequelize.query(`
    UPDATE patient_program_registration_conditions pprc
    SET patient_program_registration_id = ppr.id
    FROM patient_program_registrations ppr
    WHERE pprc.patient_id = ppr.patient_id
    AND pprc.program_registry_id = ppr.program_registry_id
    AND ppr.is_most_recent = true;
  `);

  // Make the column NOT NULL
  await query.changeColumn('patient_program_registration_conditions', 'patient_program_registration_id', {
    type: DataTypes.UUID,
    allowNull: false,
  });

  // Remove the old columns
  await query.removeColumn('patient_program_registration_conditions', 'patient_id');
  await query.removeColumn('patient_program_registration_conditions', 'program_registry_id');
}

export async function down(query: QueryInterface): Promise<void> {
  // Add back the old columns
  await query.addColumn('patient_program_registration_conditions', 'patient_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await query.addColumn('patient_program_registration_conditions', 'program_registry_id', {
    type: DataTypes.STRING,
    allowNull: true,
  });

  // Copy data back from patient_program_registrations
  await query.sequelize.query(`
    UPDATE patient_program_registration_conditions pprc
    SET 
      patient_id = ppr.patient_id,
      program_registry_id = ppr.program_registry_id
    FROM patient_program_registrations ppr
    WHERE pprc.patient_program_registration_id = ppr.id;
  `);

  // Make the old columns NOT NULL
  await query.changeColumn('patient_program_registration_conditions', 'patient_id', {
    type: DataTypes.STRING,
    allowNull: false,
  });
  await query.changeColumn('patient_program_registration_conditions', 'program_registry_id', {
    type: DataTypes.STRING,
    allowNull: false,
  });

  // Remove the new column and its constraints
  await query.removeConstraint(
    'patient_program_registration_conditions',
    'patient_program_registration_conditions_patient_program_registration_id_fk'
  );
  await query.removeIndex('patient_program_registration_conditions', [
    'patient_program_registration_id'
  ]);
  await query.removeColumn('patient_program_registration_conditions', 'patient_program_registration_id');
}
