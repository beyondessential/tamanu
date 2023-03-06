import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addNotGivenReasonIdColumnToAdministeredVaccineTable1678061990000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'administered_vaccine',
      new TableColumn({
        name: 'notGivenReasonId',
        isNullable: true,
        type: 'varchar',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('administered_vaccine', 'notGivenReasonId');
  }
}
