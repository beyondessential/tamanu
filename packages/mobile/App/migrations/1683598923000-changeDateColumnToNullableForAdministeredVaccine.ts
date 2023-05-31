import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tableName = 'administered_vaccine';
const columnName = 'date';

export class changeDateColumnToNullableForAdministeredVaccine1683598923000
  implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const administeredVaccineTable = await getTable(queryRunner, tableName);
    await queryRunner.changeColumn(
      administeredVaccineTable,
      columnName,
      new TableColumn({
        name: columnName,
        type: 'datetime',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const administeredVaccineTable = await getTable(queryRunner, tableName);
    await queryRunner.changeColumn(
      administeredVaccineTable,
      columnName,
      new TableColumn({
        name: columnName,
        type: 'datetime',
        isNullable: false,
      }),
    );
  }
}
