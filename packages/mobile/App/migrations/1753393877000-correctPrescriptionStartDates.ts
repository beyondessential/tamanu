import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class correctPrescriptionStartDates1753393877000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const prescriptionTable = await getTable(queryRunner, 'prescriptions');
    await queryRunner.changeColumn(prescriptionTable, 'startDate', new TableColumn({
      name: 'startDate',
      type: 'string',
      isNullable: true,
    }));
    await queryRunner.query(`
      UPDATE prescriptions
      SET startDate = NULL
      WHERE startDate = ''
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const prescriptionTable = await getTable(queryRunner, 'prescriptions');
    await queryRunner.query(`
      UPDATE prescriptions
      SET startDate = ''
      WHERE startDate IS NULL
    `);
    await queryRunner.changeColumn(prescriptionTable, 'startDate', new TableColumn({
        name: 'startDate',
        type: 'string',
        isNullable: false,
        default: "''",
      }),
    );
  }
}