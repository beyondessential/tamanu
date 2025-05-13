import { MigrationInterface, QueryRunner, TableForeignKey, TableColumn } from 'typeorm';

const setPatientProgramRegistrationsAndConditionsForFullResync = async (
  queryRunner: QueryRunner,
): Promise<void> => {
  await queryRunner.query('DELETE FROM patient_program_registration_conditions');
  await queryRunner.query('DELETE FROM patient_program_registrations');

  // uuid generation based on
  // https://stackoverflow.com/questions/66625085/sqlite-generate-guid-uuid-on-select-into-statement
  await queryRunner.query(`
      INSERT INTO local_system_facts (id, key, value)
      VALUES (lower(
        hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' ||
        substr(hex( randomblob(2)), 2) || '-' ||
        substr('AB89', 1 + (abs(random()) % 4) , 1)  ||
        substr(hex(randomblob(2)), 2) || '-' ||
        hex(randomblob(6))
      ), 'tablesForFullResync', 'patient_program_registration_conditions,patient_program_registrations')
    `);
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

    // Fully resync the patient_program_registration_conditions table so as not to repeat the complex logic from central server migration
    await setPatientProgramRegistrationsAndConditionsForFullResync(queryRunner);

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
