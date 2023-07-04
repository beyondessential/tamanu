import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tableName = 'administered_vaccine';
const columnName = 'consentGivenBy';

export class addConsentGivenByToAdministeredVaccine1682923186000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const administeredVaccineTable = await getTable(queryRunner, tableName);
    await queryRunner.addColumn(
      administeredVaccineTable,
      new TableColumn({
        name: columnName,
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const administeredVaccineTable = await getTable(queryRunner, tableName);
    await queryRunner.dropColumn(administeredVaccineTable, columnName);
  }
}
