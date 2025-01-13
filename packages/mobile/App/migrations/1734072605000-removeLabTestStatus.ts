import { MigrationInterface, QueryRunner } from 'typeorm';
import { getTable } from './utils/queryRunner.js';

export class removeLabTestStatus1734072605000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'labTest');
    await queryRunner.dropColumn(tableObject, 'status');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE labTest ADD COLUMN status varchar;`);
  }
}
