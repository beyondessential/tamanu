import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

import { triggerFullResync } from './utils/triggerFullResync';

const TABLE_NAME = 'patient_field_layouts';

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
    name: 'deletedAt',
    isNullable: true,
    type: 'datetime',
    default: null,
  }),
  new TableColumn({
    name: 'updatedAtSyncTick',
    type: 'bigint',
    isNullable: false,
    default: -999,
  }),
];

const PatientFieldLayoutsTable = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'fieldSource',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'fieldKey',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'definitionId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'section',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'categoryId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'sortOrder',
      type: 'integer',
      isNullable: false,
      default: 0,
    }),
    new TableColumn({
      name: 'canHide',
      type: 'boolean',
      isNullable: false,
      default: 1,
    }),
    new TableColumn({
      name: 'canDelete',
      type: 'boolean',
      isNullable: false,
      default: 1,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['definitionId'],
      referencedTableName: 'patient_field_definitions',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['categoryId'],
      referencedTableName: 'patient_field_definition_categories',
      referencedColumnNames: ['id'],
    }),
  ],
});

export class addPatientFieldLayoutsTable1774578791000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(PatientFieldLayoutsTable, true);

    // Trigger a full sync as this table already exists on the server
    await triggerFullResync(queryRunner, [TABLE_NAME]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
