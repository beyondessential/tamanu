import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'blobs';

// spec: SCRUB
// Existing rows are null, so they verify on their next read.
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
