import { type MigrationInterface, type QueryRunner, TableColumn } from 'typeorm';

const tableName = 'patient_additional_data';
const columnName = 'profilePhotoAttachmentId';

export class addProfilePhotoAttachmentIdToPatientAdditionalData1789700000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);
    const existingColumns = tableObject.columns.map(col => col.name);

    if (!existingColumns.includes(columnName)) {
      await queryRunner.addColumn(
        tableObject,
        new TableColumn({
          name: columnName,
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);
    const existingColumns = tableObject.columns.map(col => col.name);

    if (existingColumns.includes(columnName)) {
      await queryRunner.dropColumn(tableObject, columnName);
    }
  }
}
