import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addPanelRequestAttributionToLabTests1786664200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'lab_test_panel_requests',
      new TableColumn({ name: 'labRequestId', type: 'varchar', isNullable: true }),
    );
    await queryRunner.addColumn(
      'lab_tests',
      new TableColumn({ name: 'labTestPanelRequestId', type: 'varchar', isNullable: true }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lab_tests', 'labTestPanelRequestId');
    await queryRunner.dropColumn('lab_test_panel_requests', 'labRequestId');
  }
}
