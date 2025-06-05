import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // First, check for duplicates
  const duplicates = await query.sequelize.query(`
    SELECT program_registry_id, patient_id, COUNT(*) as count
    FROM patient_program_registrations
    GROUP BY program_registry_id, patient_id
    HAVING COUNT(*) > 1;
  `, { type: QueryTypes.SELECT });
  
  if (duplicates.length > 0) {
    throw new Error(`Found patient program registrations that would violate unique constraint: ${JSON.stringify(duplicates)}`);
  }

  // Add new id column to patient_program_registrations
  await query.addColumn('patient_program_registrations', 'new_id', {
    type: `TEXT GENERATED ALWAYS AS (REPLACE("patient_id", ';', ':') || ';' || REPLACE("program_registry_id", ';', ':')) STORED`,
  });

  // Update conditions table to drop foreign key constraint and populate new id column
  await query.sequelize.query(`
    ALTER TABLE patient_program_registration_conditions DROP CONSTRAINT patient_program_registration__patient_program_registration_fkey;
    ALTER TABLE patient_program_registration_conditions ADD COLUMN patient_program_registration_new_id TEXT;

    UPDATE patient_program_registration_conditions
    SET patient_program_registration_new_id = ppr.new_id
    FROM patient_program_registrations ppr
    WHERE patient_program_registration_conditions.patient_program_registration_id = ppr.id;
  `);

  // Update logs.changes table to use the new generated id
  await query.sequelize.query(`
    UPDATE logs.changes
    SET record_id = ppr.new_id
    FROM patient_program_registrations ppr
    WHERE logs.changes.record_id = ppr.id::text
      AND logs.changes.table_name = 'patient_program_registrations';
  `);

  // Remove id column in both tables
  await query.sequelize.query(`
    ALTER TABLE patient_program_registrations DROP COLUMN id;
    ALTER TABLE patient_program_registration_conditions DROP COLUMN patient_program_registration_id;
  `);

  // Rename new id column to id in both tables
  await query.sequelize.query(`
    ALTER TABLE patient_program_registrations RENAME COLUMN new_id TO id;
    ALTER TABLE patient_program_registration_conditions RENAME COLUMN patient_program_registration_new_id TO patient_program_registration_id;
  `);

  // Add constraints to id column, set new primary key and bring back foreign key constraint
  await query.sequelize.query(`
    ALTER TABLE patient_program_registrations ADD CONSTRAINT patient_program_registrations_id_key UNIQUE (id);
    ALTER TABLE patient_program_registrations ALTER COLUMN id SET NOT NULL;
    ALTER TABLE patient_program_registrations ADD PRIMARY KEY (patient_id, program_registry_id);
    ALTER TABLE patient_program_registration_conditions
      ADD CONSTRAINT patient_program_registration__patient_program_registration_fkey
      FOREIGN KEY (patient_program_registration_id)
      REFERENCES patient_program_registrations(id) ON DELETE CASCADE;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // Add old id column to patient_program_registrations
  await query.addColumn('patient_program_registrations', 'old_id', {
    type: DataTypes.UUID,
  });

  // Create deterministic ids for existing records
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET old_id = uuid_generate_v5(uuid_generate_v5(uuid_nil(), 'patient_program_registrations'), id);
  `);

  // Update conditions table to drop foreign key constraint and populate old id column
  await query.sequelize.query(`
    ALTER TABLE patient_program_registration_conditions DROP CONSTRAINT patient_program_registration__patient_program_registration_fkey;
    ALTER TABLE patient_program_registration_conditions ADD COLUMN patient_program_registration_old_id UUID;

    UPDATE patient_program_registration_conditions
    SET patient_program_registration_old_id = ppr.old_id::uuid
    FROM patient_program_registrations ppr
    WHERE patient_program_registration_conditions.patient_program_registration_id = ppr.id;
  `);

  // Update logs.changes table to use the old id column
  await query.sequelize.query(`
    UPDATE logs.changes
    SET record_id = ppr.old_id::text
    FROM patient_program_registrations ppr
    WHERE logs.changes.record_id = ppr.id
      AND logs.changes.table_name = 'patient_program_registrations';
  `);

  // Remove id column in both tables
  await query.sequelize.query(`
    ALTER TABLE patient_program_registrations DROP COLUMN id;
    ALTER TABLE patient_program_registration_conditions DROP COLUMN patient_program_registration_id;
  `);

  // Rename old id column to id in both tables
  await query.sequelize.query(`
    ALTER TABLE patient_program_registrations RENAME COLUMN old_id TO id;
    ALTER TABLE patient_program_registration_conditions RENAME COLUMN patient_program_registration_old_id TO patient_program_registration_id;
  `);

  // Drop composite foreign key, set primary key and foreign key constraint
  await query.sequelize.query(`
    ALTER TABLE patient_program_registrations DROP CONSTRAINT patient_program_registrations_pkey;
    ALTER TABLE patient_program_registrations ADD PRIMARY KEY (id);
    ALTER TABLE patient_program_registration_conditions
      ADD CONSTRAINT patient_program_registration__patient_program_registration_fkey
      FOREIGN KEY (patient_program_registration_id)
      REFERENCES patient_program_registrations(id) ON DELETE CASCADE;
  `);

  // Add default value to id column
  await query.sequelize.query(`
    ALTER TABLE patient_program_registrations ALTER COLUMN id SET DEFAULT gen_random_uuid();
  `);
}
