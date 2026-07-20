import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class setPrescriptionUnitColumnsNotNull1784521893001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
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
