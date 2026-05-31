import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addDosingAndDispensingUnitColumns1779900000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'reference_drugs',
      new TableColumn({ name: 'dosingUnit', type: 'varchar', isNullable: true }),
    );
    await queryRunner.addColumn(
      'reference_drugs',
      new TableColumn({ name: 'dispensingUnit', type: 'varchar', isNullable: true }),
    );
    await queryRunner.addColumn(
      'reference_drugs',
      new TableColumn({ name: 'unitConversion', type: 'decimal', isNullable: false, default: 1 }),
    );
    await queryRunner.query(
      `UPDATE reference_drugs SET dosingUnit = units, dispensingUnit = units`,
    );
    await queryRunner.dropColumn('reference_drugs', 'units');

    await queryRunner.addColumn(
      'prescriptions',
      new TableColumn({ name: 'dosingUnit', type: 'varchar', isNullable: true }),
    );
    await queryRunner.addColumn(
      'prescriptions',
      new TableColumn({ name: 'dispensingUnit', type: 'varchar', isNullable: true }),
    );
    await queryRunner.addColumn(
      'prescriptions',
      new TableColumn({ name: 'unitConversion', type: 'decimal', isNullable: true }),
    );
    await queryRunner.query(
      `UPDATE prescriptions SET dosingUnit = units, dispensingUnit = units`,
    );
    await queryRunner.query(`
      UPDATE prescriptions
      SET unitConversion = reference_drugs.unitConversion
      FROM reference_drugs
      WHERE reference_drugs.referenceDataId = prescriptions.medicationId
    `);
    await queryRunner.dropColumn('prescriptions', 'units');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'prescriptions',
      new TableColumn({ name: 'units', type: 'varchar', isNullable: true }),
    );
    await queryRunner.dropColumn('prescriptions', 'unitConversion');
    await queryRunner.dropColumn('prescriptions', 'dispensingUnit');
    await queryRunner.dropColumn('prescriptions', 'dosingUnit');

    await queryRunner.addColumn(
      'reference_drugs',
      new TableColumn({ name: 'units', type: 'varchar', isNullable: true }),
    );
    await queryRunner.dropColumn('reference_drugs', 'unitConversion');
    await queryRunner.dropColumn('reference_drugs', 'dispensingUnit');
    await queryRunner.dropColumn('reference_drugs', 'dosingUnit');
  }
}
