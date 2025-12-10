import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class correctPrescriptionStartDates1753393877000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Set any incorrectly defaulted empty string start dates to the prescriptions "date" column
    const prescriptionTable = await getTable(queryRunner, 'prescriptions');
    await queryRunner.query(`
      UPDATE prescriptions
      SET startDate = date
      WHERE startDate = ''
    `);
    // Remove the empty string default value
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
