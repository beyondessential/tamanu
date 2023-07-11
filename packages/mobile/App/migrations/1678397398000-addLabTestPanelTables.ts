import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

const BaseColumns = [
  new TableColumn({
    name: 'id',
    type: 'varchar',
    isPrimary: true,
  }),
  new TableColumn({
    name: 'createdAt',
    type: 'datetime',
    default: "datetime('now')",
  }),
  new TableColumn({
    name: 'updatedAt',
    type: 'datetime',
    default: "datetime('now')",
  }),
  new TableColumn({
    name: 'updatedAtSyncTick',
    type: 'bigint',
    isNullable: false,
    default: -999,
  }),
];

const LabTestPanel = new Table({
  name: 'lab_test_panel',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      default: "''",
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      default: "'current'",
    }),
  ],
  indices: [
    new TableIndex({
      name: 'lab_test_panel_lab_test_updated_at_sync_tick',
      columnNames: ['updatedAtSyncTick'],
    }),
  ],
});

const LabTestPanelLabTestType = new Table({
  name: 'lab_test_panel_lab_test_type',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'labTestPanelId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'labTesTypeId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['labTestPanelId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'lab_test_panel',
    }),
    new TableForeignKey({
      columnNames: ['labTesTypeId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'lab_test_type',
    }),
  ],
  indices: [
    new TableIndex({
      name: 'lab_test_panel_lab_test_type_updated_at_sync_tick',
      columnNames: ['updatedAtSyncTick'],
    }),
  ],
});

const LabTestPanelRequest = new Table({
  name: 'lab_test_panel_request',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'labTestPanelId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'encounter',
    }),
    new TableForeignKey({
      columnNames: ['labTestPanelId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'lab_test_panel',
    }),
  ],
  indices: [
    new TableIndex({
      name: 'lab_test_panel_request_updated_at_sync_tick',
      columnNames: ['updatedAtSyncTick'],
    }),
  ],
});

const ifNotExist = true;

export class addLabTestPanelTables1678397398000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(LabTestPanel, ifNotExist);
    await queryRunner.createTable(LabTestPanelLabTestType, ifNotExist);
    await queryRunner.createTable(LabTestPanelRequest, ifNotExist);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('lab_test_panel_request', true, true);
    await queryRunner.dropTable('lab_test_panel_lab_test_type', true, true);
    await queryRunner.dropTable('lab_test_panel', true, true);
  }
}
