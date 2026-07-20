import { MigrationInterface, QueryRunner } from 'typeorm';

export class backfillPrescriptionUnitColumns1784521893000 implements MigrationInterface {
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
  }

  async down(): Promise<void> {
    // DESTRUCTIVE: cannot restore original nulls after backfill
  }
}
