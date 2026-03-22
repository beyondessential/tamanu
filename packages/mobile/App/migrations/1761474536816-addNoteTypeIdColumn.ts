import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

const tableName = 'notes';
const columnName = 'noteTypeId';
export class addNoteTypeIdColumn1761474536816 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      tableName,
      new TableColumn({
        name: columnName,
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      tableName,
      new TableForeignKey({
        columnNames: [columnName],
        referencedColumnNames: ['id'],
        referencedTableName: 'reference_data',
      }),
    );

    await queryRunner.query(`
      UPDATE ${tableName}
      SET ${columnName} = 'notetype-' || noteType
      WHERE noteType IS NOT NULL
    `);

    await queryRunner.dropColumn(tableName, 'noteType');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);

    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'noteType',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE ${tableName}
      SET noteType = REPLACE(${columnName}, 'notetype-', '')
      WHERE noteTypeId IS NOT NULL
    `);

    const foreignKey = tableObject.foreignKeys.find(
      fk => fk.columnNames.indexOf(columnName) !== 0,
    );
    await queryRunner.dropForeignKey(tableObject, foreignKey);
    await queryRunner.dropColumn(tableObject, columnName);
  }
}
