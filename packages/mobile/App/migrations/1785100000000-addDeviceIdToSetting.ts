import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'settings';
const COLUMN_NAME = 'deviceId';

// Mirrors the server-side settings.device_id column (server-scope settings are
// keyed by device). Device-routed rows only sync to their own device, so this
// stays null on mobile — the column exists so a pulled record round-trips
// losslessly and reads can guard against misrouted rows.
export class addDeviceIdToSetting1785100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);
    await queryRunner.dropColumn(table, COLUMN_NAME);
  }
}
