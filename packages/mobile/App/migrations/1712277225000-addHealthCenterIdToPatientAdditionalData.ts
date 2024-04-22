import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

const tableName = 'patient_additional_data';
const columnName = 'healthCenterId';

export class addHealthCenterIdToPatientAdditionalData1712277225000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: columnName,
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      tableObject,
      new TableForeignKey({
        columnNames: [columnName],
        referencedColumnNames: ['id'],
        referencedTableName: 'facility',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);
    const foreignKey = tableObject.foreignKeys.find(fk => fk.columnNames.indexOf(columnName) !== 0);
    await queryRunner.dropForeignKey(tableObject, foreignKey);
    await queryRunner.dropColumn(tableObject, columnName);
  }
}
