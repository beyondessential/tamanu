import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
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

const ReferenceDrugTable = new Table({
  name: 'reference_drugs',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'route',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'units',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'notes',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'referenceDataId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['referenceDataId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
});

const ifNotExist = true;

export class addReferenceDrugsTable1739314067055 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(ReferenceDrugTable, ifNotExist);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(ReferenceDrugTable);
  }
}
