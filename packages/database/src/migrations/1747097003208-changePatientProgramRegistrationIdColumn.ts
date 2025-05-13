import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
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

  // Set primary key and foreign key constraint again
  await query.sequelize.query(`
    ALTER TABLE patient_program_registrations ADD PRIMARY KEY (id);
    ALTER TABLE patient_program_registration_conditions
      ADD CONSTRAINT patient_program_registration__patient_program_registration_fkey
      FOREIGN KEY (patient_program_registration_id)
      REFERENCES patient_program_registrations(id) ON DELETE CASCADE;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // Add old id column to patient_program_registrations
  await query.addColumn('patient_program_registrations', 'old_id', {
    type: DataTypes.TEXT,
    defaultValue: Sequelize.fn('gen_random_uuid'),
  });

  // Update conditions table to drop foreign key constraint and populate old id column
  await query.sequelize.query(`
    ALTER TABLE patient_program_registration_conditions DROP CONSTRAINT patient_program_registration__patient_program_registration_fkey;
    ALTER TABLE patient_program_registration_conditions ADD COLUMN patient_program_registration_old_id VARCHAR(255);

    UPDATE patient_program_registration_conditions
    SET patient_program_registration_old_id = ppr.old_id
    FROM patient_program_registrations ppr
    WHERE patient_program_registration_conditions.patient_program_registration_id = ppr.id;
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

  // Set primary key and foreign key constraint again
  await query.sequelize.query(`
    ALTER TABLE patient_program_registrations ADD PRIMARY KEY (id);
    ALTER TABLE patient_program_registration_conditions
      ADD CONSTRAINT patient_program_registration__patient_program_registration_fkey
      FOREIGN KEY (patient_program_registration_id)
      REFERENCES patient_program_registrations(id) ON DELETE CASCADE;
  `);
}
