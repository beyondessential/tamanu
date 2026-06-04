import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

const TABLE_NAME = 'users';
const COLUMN_NAME = 'totpConfirmedAt';

// mirrors the server's users.totp_confirmed_at (synced fact that a confirmed
// authenticator app exists; the seed itself never syncs)
export class addTotpConfirmedAtToUsers1780560982670 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);

    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: COLUMN_NAME,
        type: 'datetime',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = await getTable(queryRunner, TABLE_NAME);

    await queryRunner.dropColumn(table, COLUMN_NAME);
  }
}
