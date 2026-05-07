import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'patients';
const COLUMN_NAME = 'title';

export class removePatientTitleColumn1778199200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, COLUMN_NAME);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
