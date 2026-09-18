import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Incremental sync used to stage its snapshot in a `sync_snapshot` table in the main database.
 * It now lives in a separate attached file (see `App/infra/db/snapshotDatabase.ts`), so a table
 * left behind by a sync that never finished is dead weight, and its pages are what a later VACUUM
 * hands back.
 */
export class dropLegacySyncSnapshotTable1789691279000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS sync_snapshot');
  }

  async down(): Promise<void> {
    // Nothing to restore: the table only ever held transient data for the duration of one sync
  }
}
