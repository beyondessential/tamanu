import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

export class addQuantityToProcedures1789674206539 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'procedures',
      new TableColumn({
        name: 'quantity',
        type: 'int',
        isNullable: false,
        default: 1,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('procedures', 'quantity');
  }
}
