import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addNotGivenReasonIdColumnToAdministeredVaccineTable1678061990000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'administered_vaccine');

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'notGivenReasonId',
        isNullable: true,
        type: 'varchar',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'administered_vaccine');
    await queryRunner.dropColumn(tableObject, 'notGivenReasonId');
  }
}
