import { MigrationInterface, QueryRunner } from 'typeorm';

export class changeCaseOfSpo21665717114000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('vitals', 'spO2', 'spo2');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('vitals', 'spo2', 'spO2');
  }
}
