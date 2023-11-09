import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';
import { getTable } from './utils/queryRunner';

const labRequestTableName = 'labRequest';
const referenceDataTableName = 'reference_data';
const userTableName = 'user';
const specimenTypeIdColumn = 'specimenTypeId';
const collectedByIdColumn = 'collectedById';

export class addSpecimenTypeAndCollectedByToLabRequest1686083400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const labRequestTable = await getTable(queryRunner, labRequestTableName);
    await queryRunner.addColumn(
      labRequestTable,
      new TableColumn({
        name: specimenTypeIdColumn,
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      labRequestTable,
      new TableForeignKey({
        columnNames: [specimenTypeIdColumn],
        referencedColumnNames: ['id'],
        referencedTableName: referenceDataTableName,
      }),
    );

    await queryRunner.addColumn(
      labRequestTable,
      new TableColumn({
        name: collectedByIdColumn,
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      labRequestTable,
      new TableForeignKey({
        columnNames: [collectedByIdColumn],
        referencedColumnNames: ['id'],
        referencedTableName: userTableName,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const labRequestTable = await queryRunner.getTable(labRequestTableName);
    const specimenTypeFK = labRequestTable.foreignKeys.find(
      fk => fk.columnNames.indexOf(specimenTypeIdColumn) !== 0,
    );
    await queryRunner.dropForeignKey(labRequestTable, specimenTypeFK);
    await queryRunner.dropColumn(labRequestTable, specimenTypeIdColumn);

    const collectedByFK = labRequestTable.foreignKeys.find(
      fk => fk.columnNames.indexOf(collectedByIdColumn) !== 0,
    );
    await queryRunner.dropForeignKey(labRequestTable, collectedByFK);
    await queryRunner.dropColumn(labRequestTable, collectedByFK);
  }
}
