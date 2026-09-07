import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'blobs';

// spec: SCRUB
// When each blob's content was last confirmed to match its hash. The device runs
// no scheduled scrub, so read verification carries its integrity; recording the
// time lets repeated reads of cache content skip re-hashing a file confirmed
// recently. Nullable: existing rows are treated as unverified and are verified on
// their next read. Device-local, like the rest of the blob registry — the server
// has a scheduled scrub and needs no equivalent column.
const LAST_VERIFIED_AT = new TableColumn({
  name: 'lastVerifiedAt',
  type: 'datetime',
  isNullable: true,
});

export class addBlobLastVerifiedAt1785910000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(TABLE_NAME, LAST_VERIFIED_AT);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, LAST_VERIFIED_AT);
  }
}
