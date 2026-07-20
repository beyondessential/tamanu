import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class setPrescriptionUnitColumnsNotNull1784521893000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE prescriptions
      SET dosingUnit = (
        SELECT dosingUnit FROM reference_drugs
        WHERE reference_drugs.referenceDataId = prescriptions.medicationId
      )
      WHERE dosingUnit IS NULL
        AND EXISTS (
          SELECT 1 FROM reference_drugs
          WHERE reference_drugs.referenceDataId = prescriptions.medicationId
            AND reference_drugs.dosingUnit IS NOT NULL
        )
    `);
    await queryRunner.query(`
      UPDATE prescriptions
      SET dispensingUnit = (
        SELECT dispensingUnit FROM reference_drugs
        WHERE reference_drugs.referenceDataId = prescriptions.medicationId
      )
      WHERE dispensingUnit IS NULL
        AND EXISTS (
          SELECT 1 FROM reference_drugs
          WHERE reference_drugs.referenceDataId = prescriptions.medicationId
            AND reference_drugs.dispensingUnit IS NOT NULL
        )
    `);
    await queryRunner.query(`
      UPDATE prescriptions
      SET unitConversion = (
        SELECT unitConversion FROM reference_drugs
        WHERE reference_drugs.referenceDataId = prescriptions.medicationId
      )
      WHERE unitConversion IS NULL
        AND EXISTS (
          SELECT 1 FROM reference_drugs
          WHERE reference_drugs.referenceDataId = prescriptions.medicationId
            AND reference_drugs.unitConversion IS NOT NULL
        )
    `);

    // Fallback for any remaining nulls so NOT NULL can be applied
    await queryRunner.query("UPDATE prescriptions SET dosingUnit = '' WHERE dosingUnit IS NULL");
    await queryRunner.query(
      "UPDATE prescriptions SET dispensingUnit = '' WHERE dispensingUnit IS NULL",
    );
    await queryRunner.query(
      'UPDATE prescriptions SET unitConversion = 1 WHERE unitConversion IS NULL',
    );

    await queryRunner.changeColumn(
      await getTable(queryRunner, 'prescriptions'),
      'dosingUnit',
      new TableColumn({ name: 'dosingUnit', type: 'varchar', isNullable: false }),
    );
    await queryRunner.changeColumn(
      await getTable(queryRunner, 'prescriptions'),
      'dispensingUnit',
      new TableColumn({ name: 'dispensingUnit', type: 'varchar', isNullable: false }),
    );
    await queryRunner.changeColumn(
      await getTable(queryRunner, 'prescriptions'),
      'unitConversion',
      new TableColumn({
        name: 'unitConversion',
        type: 'decimal',
        isNullable: false,
        default: 1,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      await getTable(queryRunner, 'prescriptions'),
      'dosingUnit',
      new TableColumn({ name: 'dosingUnit', type: 'varchar', isNullable: true }),
    );
    await queryRunner.changeColumn(
      await getTable(queryRunner, 'prescriptions'),
      'dispensingUnit',
      new TableColumn({ name: 'dispensingUnit', type: 'varchar', isNullable: true }),
    );
    await queryRunner.changeColumn(
      await getTable(queryRunner, 'prescriptions'),
      'unitConversion',
      new TableColumn({ name: 'unitConversion', type: 'decimal', isNullable: true }),
    );
  }
}
