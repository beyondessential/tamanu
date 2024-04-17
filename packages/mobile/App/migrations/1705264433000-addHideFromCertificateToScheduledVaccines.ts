import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addHideFromCertificateToScheduledVaccines1705264433000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'scheduled_vaccine');

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'hideFromCertificate',
        isNullable: false,
        type: 'boolean',
        default: 0,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'scheduled_vaccine');
    await queryRunner.dropColumn(tableObject, 'hideFromCertificate');
  }
}
