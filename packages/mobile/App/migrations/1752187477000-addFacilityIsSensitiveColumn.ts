import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addFacilityIsSensitiveColumn1752187477000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const facilitiesTable = await getTable(queryRunner, 'facilities');
    await queryRunner.addColumn(
      facilitiesTable,
      new TableColumn({
        name: 'isSensitive',
        type: 'boolean',
        isNullable: false,
        default: 0,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const facilitiesTable = await getTable(queryRunner, 'facilities');
    await queryRunner.dropColumn(facilitiesTable, 'isSensitive');
  }
}
