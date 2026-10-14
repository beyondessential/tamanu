import type { MigrationInterface, QueryRunner } from 'typeorm';
import { SETTINGS_SCOPES } from '@tamanu/constants';

// Central-scope settings never sync, so any copies here are leftovers.
export class dropSyncedCentralSettings1791875574000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM settings WHERE scope = '${SETTINGS_SCOPES.CENTRAL}'`);
  }

  async down(): Promise<void> {
    // DESTRUCTIVE: the deleted central-scope settings rows are not restored.
  }
}
