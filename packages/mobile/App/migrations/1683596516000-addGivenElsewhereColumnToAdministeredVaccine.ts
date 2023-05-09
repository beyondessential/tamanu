import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tableName = 'administered_vaccine';
const columnName = 'givenElsewhere';

export class addGivenElsewhereColumnToAdministeredVaccine1683596516000
  implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const administeredVaccineTable = await getTable(queryRunner, tableName);
    await queryRunner.addColumn(
      administeredVaccineTable,
      new TableColumn({
        name: columnName,
        type: 'boolean',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const administeredVaccineTable = await getTable(queryRunner, tableName);
    await queryRunner.dropColumn(administeredVaccineTable, columnName);
  }
}
