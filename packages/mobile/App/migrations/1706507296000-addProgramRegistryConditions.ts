import {
  MigrationInterface,
  TableIndex,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'program_registry_condition';

const baseIndex = new TableIndex({
  columnNames: ['updatedAtSyncTick'],
});

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
  new TableColumn({
    name: 'deletedAt',
    isNullable: true,
    type: 'date',
    default: null,
  }),
];

const ProgramRegistryCondition = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'programRegistryId',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['programRegistryId'],
      referencedTableName: 'program_registry',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});
export class addProgramRegistryConditions1706507296000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(ProgramRegistryCondition, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
