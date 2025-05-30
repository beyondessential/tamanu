import { MigrationInterface, QueryRunner, TableForeignKey, TableColumn } from 'typeorm';

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
