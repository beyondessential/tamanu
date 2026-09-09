import type { MigrationInterface, QueryRunner } from 'typeorm';

/** @see `1787706001000-enforceUniqueLocalSystemFactKeys` companion schema migration*/
export class dedupeLocalSystemFacts1787706000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // No code path should ever have soft-deleted a local_system_facts record, so this is basically
    // certain to be a no-op 100% of the time. Belting-and-bracing because goodness knows we don’t
    // want the dedupe query below to accidentally keep a soft-deleted record.
    await queryRunner.query('DELETE FROM local_system_facts WHERE deletedAt IS NOT NULL;');

    await queryRunner.query(`
      DELETE FROM local_system_facts
      WHERE EXISTS (
        SELECT 1 FROM local_system_facts other
        WHERE other.key = local_system_facts.key
          AND (
            other.updatedAt > local_system_facts.updatedAt
            OR (other.updatedAt = local_system_facts.updatedAt AND other.rowid > local_system_facts.rowid)
          )
      );
    `);
  }

  /** Can’t restore deleted records */
  async down(): Promise<void> {}
}
