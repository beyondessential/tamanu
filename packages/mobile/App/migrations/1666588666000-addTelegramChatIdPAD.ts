import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addTelegramChatIdPAD1666588666000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await getTable(queryRunner, 'patient_additional_data');
    await queryRunner.addColumn(
      tableObject,
      new TableColumn({
        name: 'telegramChatId',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('patient_additional_data', 'telegramChatId');
  }
}
