import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

const TABLE_NAME = 'sync_benchmarks';

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

const SyncBenchmarksTable = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'sessionId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'benchmark',
      type: 'text',
      isNullable: false,
    }),
  ],
  indices: [
    new TableIndex({
      name: 'idx_sync_benchmarks_session_id',
      columnNames: ['sessionId'],
    }),
    new TableIndex({
      name: 'idx_sync_benchmarks_created_at',
      columnNames: ['createdAt'],
    }),
    new TableIndex({
      name: 'idx_sync_benchmarks_updated_at_sync_tick',
      columnNames: ['updatedAtSyncTick'],
    }),
  ],
});

export class createSyncBenchmarksTable1750882665000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(SyncBenchmarksTable, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
} 