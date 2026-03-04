import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

interface Condition {
  id: string;
  patient_id: string;
  program_registry_id: string;
}

interface Registration {
  id: string;
  created_at: Date;
  is_most_recent: boolean;
}

async function populateRegistrationIds(query: QueryInterface): Promise<void> {
  // Get all conditions
  const conditions = await query.sequelize.query<Condition>(
    `
    SELECT id, patient_id, program_registry_id
    FROM patient_program_registration_conditions;
  `,
    { type: QueryTypes.SELECT },
  );

  for (const condition of conditions) {
    // First try to get the most recent registration
    const registrations = await query.sequelize.query<Registration>(
      `
      SELECT id, created_at, is_most_recent
      FROM patient_program_registrations
      WHERE patient_id = :patientId
      AND program_registry_id = :programRegistryId
      ORDER BY date DESC;
    `,
      {
        replacements: {
          patientId: condition.patient_id,
          programRegistryId: condition.program_registry_id,
        },
        type: QueryTypes.SELECT,
      },
    );

    if (registrations.length === 0) { continue; }

    // Get the registration ID to use
    let registrationId: string;

    // First check for most recent flag
    const mostRecent = registrations.find((r) => r.is_most_recent);
    if (mostRecent) {
      registrationId = mostRecent.id;
    } else {
      // If no most_recent flag, use the latest by date
      registrationId = registrations[0]!.id;
    }

    // Update the condition with the registration ID
    await query.sequelize.query(
      `
      UPDATE patient_program_registration_conditions
      SET patient_program_registration_id = :registrationId
      WHERE id = :conditionId
    `,
      {
        replacements: {
          registrationId,
          conditionId: condition.id,
        },
      },
    );
  }
}

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
      onDelete: 'CASCADE',
    },
  );

  // Add index for the new column
  await query.addIndex('patient_program_registration_conditions', [
    'patient_program_registration_id',
  ]);

  // Update all conditions to link to their most recent program registration
  await populateRegistrationIds(query);

  // Make the column NOT NULL
  await query.changeColumn(
    'patient_program_registration_conditions',
    'patient_program_registration_id',
    {
      type: DataTypes.UUID,
      allowNull: false,
    },
  );

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

  await query.addConstraint('patient_program_registration_conditions', {
    type: 'foreign key',
    name: 'patient_program_registration_conditions_patient_id_fkey',
    fields: ['patient_id'],
    references: {
      table: 'patients',
      field: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  await query.addConstraint('patient_program_registration_conditions', {
    type: 'foreign key',
    name: 'patient_program_registration_conditions_program_registry_id_fkey',
    fields: ['program_registry_id'],
    references: {
      table: 'program_registries',
      field: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
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

  // Remove the new column
  await query.removeIndex('patient_program_registration_conditions', [
    'patient_program_registration_id',
  ]);
  await query.removeColumn(
    'patient_program_registration_conditions',
    'patient_program_registration_id',
  );
}
