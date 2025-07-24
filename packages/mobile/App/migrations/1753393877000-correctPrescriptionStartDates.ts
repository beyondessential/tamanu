import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class correctPrescriptionStartDates1753393877000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const prescriptionTable = await getTable(queryRunner, 'prescriptions');
    await queryRunner.query(`
      UPDATE prescriptions
      SET startDate = date
      WHERE startDate = ''
    `);
    await queryRunner.changeColumn(prescriptionTable, 'startDate', new TableColumn({
      name: 'startDate',
      type: 'string',
      isNullable: false,
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const prescriptionTable = await getTable(queryRunner, 'prescriptions');
    await queryRunner.changeColumn(prescriptionTable, 'startDate', new TableColumn({
        name: 'startDate',
        type: 'string',
        isNullable: false,
        default: "''",
      }),
    );
  }
}
