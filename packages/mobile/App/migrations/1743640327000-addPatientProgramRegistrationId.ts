import { MigrationInterface, QueryRunner, TableForeignKey, TableColumn } from 'typeorm';

const setPatientProgramRegistrationsForFullResync = async (
  queryRunner: QueryRunner,
): Promise<void> => {
  await queryRunner.query('DELETE FROM patient_program_registration_conditions');
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
      ), 'tablesForFullResync', 'patient_program_registration_conditions')
    `);
};

export class addPatientProgramRegistrationId1743640327000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    console.log('...1');

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
    console.log('...2');

    await queryRunner.dropColumn('patient_program_registration_conditions', 'patientId');
    await queryRunner.dropColumn('patient_program_registration_conditions', 'programRegistryId');

    console.log('...3');

    await setPatientProgramRegistrationsForFullResync(queryRunner);

    console.log('...4');

    // Add patientProgramRegistrationId column
    await queryRunner.addColumn(
      'patient_program_registration_conditions',
      new TableColumn({
        name: 'patientProgramRegistrationId',
        type: 'TEXT',
        isNullable: false,
      }),
    );

    console.log('...5');

    console.log('TableColumn', TableColumn);
    console.log('TableForeignKey', TableForeignKey);

    try {
      // Add foreign key constraint
      await queryRunner.createForeignKey(
        'patient_program_registration_conditions',
        new TableForeignKey({
          columnNames: ['patientProgramRegistrationId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'patient_program_registrations',
        }),
      );
    } catch (error) {
      console.error('Error creating foreign key:', error);
    }

    console.log('...6');
  }

  async down(): Promise<void> {
    // destructive up, no possible down
  }
}
