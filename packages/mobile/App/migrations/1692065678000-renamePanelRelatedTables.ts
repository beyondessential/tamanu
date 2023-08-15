import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class renamePanelRelatedTables1692065678000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('lab_test_panel', 'lab_panel');
    const labTestPanelRequestTable = await queryRunner.getTable('lab_test_panel_request');
    const labTestPanelRequestFKey = labTestPanelRequestTable?.foreignKeys.find(
      fk => fk.columnNames.indexOf('labTestPanelId') !== -1,
    );
    if (labTestPanelRequestFKey) {
      await queryRunner.dropForeignKey('lab_test_panel_request', labTestPanelRequestFKey);
    }
    await queryRunner.renameColumn('lab_test_panel_request', 'labTestPanelId', 'labPanelId');
    await queryRunner.createForeignKey(
      'lab_test_panel_request',
      new TableForeignKey({
        columnNames: ['labPanelId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lab_panel',
      }),
    );
    await queryRunner.renameTable('lab_test_panel_request', 'lab_panel_request');
    const labTestPanelLabTestTypeTable = await queryRunner.getTable('lab_test_panel_lab_test_type');
    const labTestPanelLabTestTypeFKey = labTestPanelLabTestTypeTable?.foreignKeys.find(
      fk => fk.columnNames.indexOf('labTestPanelId') !== -1,
    );
    if (labTestPanelLabTestTypeFKey) {
      await queryRunner.dropForeignKey('lab_test_panel_lab_test_type', labTestPanelLabTestTypeFKey);
    }
    await queryRunner.renameColumn('lab_test_panel_lab_test_type', 'labTestPanelId', 'labPanelId');
    await queryRunner.renameColumn('lab_test_panel_lab_test_type', 'labTesTypeId', 'labTestTypeId');
    await queryRunner.createForeignKey(
      'lab_test_panel_lab_test_type',
      new TableForeignKey({
        columnNames: ['labPanelId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lab_panel',
      }),
    );
    await queryRunner.renameTable('lab_test_panel_lab_test_type', 'lab_panel_lab_test_type');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('lab_panel', 'lab_test_panel');
    const labPanelRequestTable = await queryRunner.getTable('lab_panel_request');
    const labPanelRequestFKey = labPanelRequestTable?.foreignKeys.find(
      fk => fk.columnNames.indexOf('labPanelId') !== -1,
    );
    if (labPanelRequestFKey) {
      await queryRunner.dropForeignKey('lab_panel_request', labPanelRequestFKey);
    }
    await queryRunner.renameColumn('lab_panel_request', 'labPanelId', 'labTestPanelId');
    await queryRunner.createForeignKey(
      'lab_panel_request',
      new TableForeignKey({
        columnNames: ['labTestPanelId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lab_test_panel',
      }),
    );
    await queryRunner.renameTable('lab_panel_request', 'lab_test_panel_request');
    const labPanelLabTestTypeTable = await queryRunner.getTable('lab_panel_lab_test_type');
    const labPanelLabTestTypeFKey = labPanelLabTestTypeTable?.foreignKeys.find(
      fk => fk.columnNames.indexOf('labPanelId') !== -1,
    );
    if (labPanelLabTestTypeFKey) {
      await queryRunner.dropForeignKey('lab_panel_lab_test_type', labPanelLabTestTypeFKey);
    }
    await queryRunner.renameColumn('lab_panel_lab_test_type', 'labPanelId', 'labTestPanelId');
    await queryRunner.createForeignKey(
      'lab_panel_lab_test_type',
      new TableForeignKey({
        columnNames: ['labTestPanelId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'lab_test_panel',
      }),
    );
    await queryRunner.renameColumn('lab_panel_lab_test_type', 'labTestTypeId', 'labTesTypeId');
    await queryRunner.renameTable('lab_panel_lab_test_type', 'lab_test_panel_lab_test_type');
  }
}
