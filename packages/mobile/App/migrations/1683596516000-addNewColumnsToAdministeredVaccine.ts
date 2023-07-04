import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const tableName = 'administered_vaccine';

export class addNewColumnsToAdministeredVaccine1683596516000
  implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const administeredVaccineTable = await getTable(queryRunner, tableName);
    await queryRunner.addColumn(
      administeredVaccineTable,
      new TableColumn({
        name: 'givenElsewhere',
        type: 'boolean',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      administeredVaccineTable,
      new TableColumn({
        name: 'circumstanceIds',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      administeredVaccineTable,
      new TableColumn({
        name: 'disease',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      administeredVaccineTable,
      new TableColumn({
        name: 'vaccineBrand',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      administeredVaccineTable,
      new TableColumn({
        name: 'vaccineName',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const administeredVaccineTable = await getTable(queryRunner, tableName);
    await queryRunner.dropColumn(administeredVaccineTable, 'givenElsewhere');
    await queryRunner.dropColumn(administeredVaccineTable, 'circumstanceIds');
    await queryRunner.dropColumn(administeredVaccineTable, 'disease');
    await queryRunner.dropColumn(administeredVaccineTable, 'vaccineBrand');
    await queryRunner.dropColumn(administeredVaccineTable, 'vaccineName');
  }
}
