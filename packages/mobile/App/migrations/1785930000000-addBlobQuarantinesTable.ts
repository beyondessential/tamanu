import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

const TABLE_NAME = 'blob_quarantines';

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

// spec: AV
// Content known to be malware, named by hash and pulled from central. The
// device runs no scanner, so this is the whole of what it knows about content:
// enough to refuse to serve or fetch it, with the link down as much as up.
const BlobQuarantinesTable = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'hash',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'scannerVersion',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'signatureVersion',
      type: 'varchar',
      isNullable: true,
    }),
  ],
});

const hashIndex = new TableIndex({
  name: 'blob_quarantines_hash',
  columnNames: ['hash'],
  isUnique: true,
});

export class addBlobQuarantinesTable1785930000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(BlobQuarantinesTable, true);
    await queryRunner.createIndex(TABLE_NAME, hashIndex);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
