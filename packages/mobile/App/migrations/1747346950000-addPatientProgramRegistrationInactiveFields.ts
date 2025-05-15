import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'patient_program_registrations';

export class addPatientProgramRegistrationInactiveFields1747346950000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, TABLE_NAME);

    // Add deactivated_clinician_id column
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'deactivated_clinician_id',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Add foreign key for deactivated_clinician_id
    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: ['deactivated_clinician_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Add deactivated_date column
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'deactivated_date',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key for deactivated_clinician_id
    const table = await getTable(queryRunner, TABLE_NAME);
    const foreignKey = table.foreignKeys.find(
      fk => fk.columnNames.indexOf('deactivated_clinician_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey(TABLE_NAME, foreignKey);
    }

    // Drop columns
    await queryRunner.dropColumn(TABLE_NAME, 'deactivated_clinician_id');
    await queryRunner.dropColumn(TABLE_NAME, 'deactivated_date');
  }
}
