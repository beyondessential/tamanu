import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'encounter';
const COLUMN_NAME = 'dietId';

export class addDietIdForEncounter1713722796000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.addColumn(
      usersTable,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      usersTable,
      new TableForeignKey({
        columnNames: [COLUMN_NAME],
        referencedColumnNames: ['id'],
        referencedTableName: 'reference_data',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const usersTable = await getTable(queryRunner, TABLE_NAME);
    const foreignKey = usersTable.foreignKeys.find(
      fk => fk.columnNames.indexOf(COLUMN_NAME) !== 0,
    );
    await queryRunner.dropForeignKey(usersTable, foreignKey);
    await queryRunner.dropColumn(usersTable, COLUMN_NAME);
  }
}
