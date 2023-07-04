import { MigrationInterface, QueryRunner } from 'typeorm';

// When we're upgrading into a version that uses migrations, we may have run a model sync
// Test if this is the case, and if it was, skip this migration
async function testSkipMigration(queryRunner: QueryRunner): Promise<boolean> {
  const columns = await queryRunner.query("PRAGMA table_info('vitals');");
  return columns.find(c => c.name === 'spo2');
}

export class changeCaseOfSpo21665717114000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    if (await testSkipMigration(queryRunner)) {
      console.log('Skipping migration as the result has already been achieved by a forced sync');
      return;
    }
    await queryRunner.renameColumn('vitals', 'spO2', 'spo2');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('vitals', 'spo2', 'spO2');
  }
}
