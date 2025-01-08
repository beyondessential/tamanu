import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeLabTestStatus1734072605000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE labTest DROP COLUMN status;`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE labTest ADD COLUMN status varchar;`);
  }
}
