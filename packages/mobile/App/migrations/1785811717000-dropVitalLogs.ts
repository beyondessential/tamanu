import { MigrationInterface, QueryRunner } from 'typeorm';

export class dropVitalLogs1785811717000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('vital_logs', true);
  }

  async down(): Promise<void> {
    // DESTRUCTIVE: the table and its rows are not restored. Vital edit history
    // lives in the changelog on the servers; mobile holds none.
  }
}
