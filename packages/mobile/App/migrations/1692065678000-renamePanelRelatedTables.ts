import { MigrationInterface, QueryRunner } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class renamePanelRelatedTables1692065678000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const labTestPanelTable = await getTable(queryRunner, 'lab_test_panel');
    const labTestPanelRequestTable = await getTable(queryRunner, 'lab_test_panel_request');
    const labTestPanelLabTestTypeTable = await getTable(
      queryRunner,
      'lab_test_panel_lab_test_type',
    );
    await queryRunner.renameTable(labTestPanelTable, 'lab_panel');

    await queryRunner.renameColumn(labTestPanelRequestTable, 'labTestPanelId', 'labPanelId');
    await queryRunner.renameTable(labTestPanelRequestTable, 'lab_panel_request');

    await queryRunner.renameColumn(labTestPanelLabTestTypeTable, 'labTestPanelId', 'labPanelId');
    // Correct a typo in the column name
    await queryRunner.renameColumn(labTestPanelLabTestTypeTable, 'labTesTypeId', 'labTestTypeId');
    await queryRunner.renameTable(labTestPanelLabTestTypeTable, 'lab_panel_lab_test_type');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const labPanelTable = await getTable(queryRunner, 'lab_panel');
    const labPanelRequestTable = await getTable(queryRunner, 'lab_panel_request');
    const labPanelLabTestTypeTable = await getTable(queryRunner, 'lab_panel_lab_test_type');
    await queryRunner.renameTable(labPanelTable, 'lab_test_panel');

    await queryRunner.renameColumn(labPanelRequestTable, 'labPanelId', 'labTestPanelId');
    await queryRunner.renameTable(labPanelRequestTable, 'lab_test_panel_request');

    await queryRunner.renameColumn(labPanelLabTestTypeTable, 'labPanelId', 'labTestPanelId');
    await queryRunner.renameColumn(labPanelLabTestTypeTable, 'labTestTypeId', 'labTesTypeId');
    await queryRunner.renameTable(labPanelLabTestTypeTable, 'lab_test_panel_lab_test_type');
  }
}
