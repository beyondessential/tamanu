import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addIsPharmacyEncounterToEncounters1782292366000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const encountersTable = await getTable(queryRunner, 'encounters');
    await queryRunner.addColumn(
      encountersTable,
      new TableColumn({
        name: 'isPharmacyEncounter',
        type: 'boolean',
        isNullable: false,
        default: 0,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const encountersTable = await getTable(queryRunner, 'encounters');
    await queryRunner.dropColumn(encountersTable, 'isPharmacyEncounter');
  }
}
