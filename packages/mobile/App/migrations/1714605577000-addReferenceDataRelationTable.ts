import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

const TABLE_NAME = 'reference_data_relation';

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
    type: 'datetime',
    default: null,
    isNullable: true,
  }),
  new TableColumn({
    name: 'updatedAtSyncTick',
    type: 'bigint',
    isNullable: false,
    default: -999,
  }),
];

const baseIndex = new TableIndex({
  columnNames: ['updatedAtSyncTick'],
});

const ReferenceDataRelationTable = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'referenceDataId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'referenceDataParentId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'type',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['referenceDataId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['referenceDataParentId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [
    baseIndex,
    new TableIndex({
      name: 'reference_data_id_type',
      columnNames: ['referenceDataId', 'type'],
      isUnique: true,
    }),
    new TableIndex({
      name: 'reference_data_relations_reference_data_id_index',
      columnNames: ['referenceDataId'],
    }),
    new TableIndex({
      name: 'referenceData_relations_parent_relation_id_index',
      columnNames: ['referenceDataParentId'],
    }),
    new TableIndex({
      name: 'referenceData_relations_type_index',
      columnNames: ['type'],
    }),
  ],
});

export class addReferenceDataRelationTable1714605577000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(ReferenceDataRelationTable, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
