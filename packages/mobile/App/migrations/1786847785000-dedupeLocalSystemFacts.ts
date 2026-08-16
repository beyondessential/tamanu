import type { MigrationInterface, QueryRunner } from 'typeorm';

/** @see `1786847786000-enforceUniqueLocalSystemFactKeys` companion schema migration*/
export class dedupeLocalSystemFacts1786847785000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
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
