import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'scheduled_vaccine';
const COLUMN_NAME = 'sort';

export class addSortColumnToScheduledVaccines1715658297000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, TABLE_NAME);

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'integer',
        isNullable: false,
        default: 0,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, TABLE_NAME);

    await queryRunner.dropColumn(tableObject, COLUMN_NAME);
  }
}
