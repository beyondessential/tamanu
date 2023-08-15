import { MigrationInterface, QueryRunner } from 'typeorm';

export class renamePanelRelatedTables1692065678000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('lab_test_panel', 'lab_panel');

    await queryRunner.renameColumn('lab_test_panel_request', 'labTestPanelId', 'labPanelId');
    await queryRunner.renameTable('lab_test_panel_request', 'lab_panel_request');

    await queryRunner.renameColumn('lab_test_panel_lab_test_type', 'labTestPanelId', 'labPanelId');
    // Correct a typo in the column name
    await queryRunner.renameColumn('lab_test_panel_lab_test_type', 'labTesTypeId', 'labTestTypeId');
    await queryRunner.renameTable('lab_test_panel_lab_test_type', 'lab_panel_lab_test_type');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('lab_panel', 'lab_test_panel');

    await queryRunner.renameColumn('lab_panel_request', 'labPanelId', 'labTestPanelId');
    await queryRunner.renameTable('lab_panel_request', 'lab_test_panel_request');

    await queryRunner.renameColumn('lab_panel_lab_test_type', 'labPanelId', 'labTestPanelId');

    await queryRunner.renameColumn('lab_panel_lab_test_type', 'labTestTypeId', 'labTesTypeId');
    await queryRunner.renameTable('lab_panel_lab_test_type', 'lab_test_panel_lab_test_type');
  }
}
