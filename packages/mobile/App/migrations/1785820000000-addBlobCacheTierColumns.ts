import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

const TABLE_NAME = 'blobs';

// spec: CACHE
// The outbox-and-cache dimensions of the blob registry, mirroring the server
// migration of the same name: durability tier, LRU recency, and the outbox
// dysfunction measure.
const NEW_COLUMNS = [
  new TableColumn({
    name: 'tier',
    type: 'varchar',
    isNullable: false,
    default: "'cache'",
  }),
  new TableColumn({
    name: 'lastAccessedAt',
    type: 'datetime',
    isNullable: false,
    default: "datetime('now')",
  }),
  new TableColumn({
    name: 'syncCyclesUnpushed',
    type: 'integer',
    isNullable: false,
    default: 0,
  }),
];

const tierRecencyIndex = new TableIndex({
  name: 'blobs_tier_last_accessed_at',
  columnNames: ['tier', 'lastAccessedAt'],
});

export class addBlobCacheTierColumns1785820000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns(TABLE_NAME, NEW_COLUMNS);
    await queryRunner.createIndex(TABLE_NAME, tierRecencyIndex);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(TABLE_NAME, tierRecencyIndex);
    await queryRunner.dropColumns(TABLE_NAME, NEW_COLUMNS);
  }
}
