import { MigrationInterface, QueryRunner } from 'typeorm';
import { SYSTEM_USER_UUID } from '@tamanu/constants';

export class ensureSystemUserPresent1758183012000 implements MigrationInterface {
  // The system user is created by migrations, which means it won't necessarily be present
  // in the sync_lookup table. So gotta make sure we create it here
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "users"
      (id, email, displayName, role)
      VALUES
      ('${SYSTEM_USER_UUID}', 'system', 'System', 'system')
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  async down(): Promise<void> {
    // No need for a down migration here
  }
}
