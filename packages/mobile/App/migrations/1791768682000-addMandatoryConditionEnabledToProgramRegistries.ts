import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

export class addMandatoryConditionEnabledToProgramRegistries1791768682000
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<void> {
    const programRegistriesTable = await getTable(queryRunner, 'program_registries');
    await queryRunner.addColumn(
      programRegistriesTable,
      new TableColumn({
        name: 'mandatoryConditionEnabled',
        type: 'boolean',
        isNullable: false,
        default: 0,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const programRegistriesTable = await getTable(queryRunner, 'program_registries');
    await queryRunner.dropColumn(programRegistriesTable, 'mandatoryConditionEnabled');
  }
}
