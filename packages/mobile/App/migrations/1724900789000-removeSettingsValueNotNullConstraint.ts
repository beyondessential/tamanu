import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class removeSettingsValueNotNullConstraint1724900789000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'setting');
    await queryRunner.changeColumn(
      tableObject,
      'value',
      new TableColumn({
        name: 'value',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'setting');
    await queryRunner.changeColumn(
      tableObject,
      'value',
      new TableColumn({
        name: 'value',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }
}
