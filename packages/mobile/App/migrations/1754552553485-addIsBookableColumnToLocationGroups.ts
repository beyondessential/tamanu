import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addIsBookableColumnToLocationGroups1754552553485 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, 'location_groups');
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'isBookable',
        type: 'string',
        isNullable: false,
        default: "'no'",
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, 'location_groups');
    await queryRunner.dropColumn(table, 'isBookable');
  }
}
