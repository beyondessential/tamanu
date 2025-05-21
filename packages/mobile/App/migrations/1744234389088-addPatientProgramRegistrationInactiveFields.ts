import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'patient_program_registrations';

export class addPatientProgramRegistrationInactiveFields1744234389088
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, TABLE_NAME);

    // Add deactivatedClinicianId column
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'deactivatedClinicianId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Add foreign key for deactivatedClinicianId
    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: ['deactivatedClinicianId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add deactivatedDate column
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'deactivatedDate',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key for deactivatedClinicianId
    const table = await getTable(queryRunner, TABLE_NAME);
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('deactivatedClinicianId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey(TABLE_NAME, foreignKey);
    }

    // Drop columns
    await queryRunner.dropColumn(TABLE_NAME, 'deactivatedClinician_id');
    await queryRunner.dropColumn(TABLE_NAME, 'deactivatedDate');
  }
}
