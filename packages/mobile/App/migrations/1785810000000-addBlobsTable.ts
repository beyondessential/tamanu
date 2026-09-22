import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

const TABLE_NAME = 'blobs';

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

// spec: CAS
// The local blob registry: which blobs this device holds on disk, their size,
// and their integrity state. Local to the device — never synced.
const BlobsTable = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'hash',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'size',
      type: 'bigint',
      isNullable: false,
    }),
    new TableColumn({
      name: 'integrityState',
      type: 'varchar',
      isNullable: false,
      default: "'verified'",
    }),
  ],
});

const hashIndex = new TableIndex({
  name: 'blobs_hash',
  columnNames: ['hash'],
  isUnique: true,
});

export class addBlobsTable1785810000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(BlobsTable, true);
    await queryRunner.createIndex(TABLE_NAME, hashIndex);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
