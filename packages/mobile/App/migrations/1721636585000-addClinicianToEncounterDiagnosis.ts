import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'diagnosis';
const COLUMN_NAME = 'clinicianId';

export class addClinicianToEncounterDiagnosis1721636585000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      tableObject,
      new TableForeignKey({
        columnNames: [COLUMN_NAME],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.dropColumn(tableObject, COLUMN_NAME);
  }
}
