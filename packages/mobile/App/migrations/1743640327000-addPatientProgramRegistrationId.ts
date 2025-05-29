import { MigrationInterface, QueryRunner, TableForeignKey, TableColumn } from 'typeorm';

const updateTablesForFullResync = async (
  queryRunner: QueryRunner,
  newTables: string[],
): Promise<void> => {
  // First, check if the record exists
  const existingRecord = await queryRunner.query(
    `SELECT id, value FROM local_system_facts WHERE key = 'tablesForFullResync'`,
  );

  if (existingRecord && existingRecord.length > 0) {
    // Record exists, update it by appending the new tables
    const currentValue = existingRecord[0].value;
    const currentTables = currentValue.split(',');

    // Combine current tables with new tables, removing duplicates
    const allTables = [...new Set([...currentTables, ...newTables])];
    const newValue = allTables.join(',');

    await queryRunner.query(
      `UPDATE local_system_facts
       SET value = ?
       WHERE id = ?`,
      [newValue, existingRecord[0].id],
    );
  } else {
    // Record doesn't exist, create a new one

    // uuid generation based on
    // https://stackoverflow.com/questions/66625085/sqlite-generate-guid-uuid-on-select-into-statement
    await queryRunner.query(
      `
      INSERT INTO local_system_facts (id, key, value)
      VALUES (lower(
        hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' ||
        substr(hex(randomblob(2)), 2) || '-' ||
        substr('AB89', 1 + (abs(random()) % 4) , 1)  ||
        substr(hex(randomblob(2)), 2) || '-' ||
        hex(randomblob(6))
      ), 'tablesForFullResync', ?)
    `,
      [newTables.join(',')],
    );
  }
};

export class addPatientProgramRegistrationId1743640327000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Remove old columns
    const tableObject = await queryRunner.getTable('patient_program_registration_conditions');
    const patientIdForeignKey = tableObject.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('patientId') !== -1,
    );
    const programRegistryIdForeignKey = tableObject.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('programRegistryId') !== -1,
    );
    if (patientIdForeignKey) {
      await queryRunner.dropForeignKey(
        'patient_program_registration_conditions',
        patientIdForeignKey,
      );
    }
    if (programRegistryIdForeignKey) {
      await queryRunner.dropForeignKey(
        'patient_program_registration_conditions',
        programRegistryIdForeignKey,
      );
    }
    await queryRunner.dropColumn('patient_program_registration_conditions', 'patientId');
    await queryRunner.dropColumn('patient_program_registration_conditions', 'programRegistryId');

    await queryRunner.query('DELETE FROM patient_program_registration_conditions');
    await queryRunner.query('DELETE FROM patient_program_registrations');

    // Fully resync the patient_program_registration_conditions table so as not to repeat the complex logic from central server migration
    await updateTablesForFullResync(queryRunner, [
      'patient_program_registrations',
      'patient_program_registration_conditions',
      'patient_additional_data',
    ]);

    // Add patientProgramRegistrationId column
    await queryRunner.addColumn(
      'patient_program_registration_conditions',
      new TableColumn({
        name: 'patientProgramRegistrationId',
        type: 'TEXT',
        isNullable: false,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'patient_program_registration_conditions',
      new TableForeignKey({
        columnNames: ['patientProgramRegistrationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'patient_program_registrations',
      }),
    );
  }

  async down(): Promise<void> {
    // destructive up, no possible down
  }
}
