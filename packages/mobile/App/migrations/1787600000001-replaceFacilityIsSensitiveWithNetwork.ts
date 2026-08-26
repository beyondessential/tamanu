import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { getTable } from './utils/queryRunner';

// A facility is sensitive exactly when it belongs to a sensitive network, so the flag goes.
// Mobile pulls facilities fresh from central, which has already run its own backfill, so there is
// nothing to migrate locally. spec: specs/sync/sensitive-networks.md
export class replaceFacilityIsSensitiveWithNetwork1787600000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const facilitiesTable = await getTable(queryRunner, 'facilities');
    await queryRunner.addColumn(
      facilitiesTable,
      new TableColumn({
        name: 'sensitiveNetworkId',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.dropColumn(facilitiesTable, 'isSensitive');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const facilitiesTable = await getTable(queryRunner, 'facilities');
    // DESTRUCTIVE: the flag comes back cleared for every facility. The next sync restores it.
    await queryRunner.addColumn(
      facilitiesTable,
      new TableColumn({
        name: 'isSensitive',
        type: 'boolean',
        isNullable: false,
        default: 0,
      }),
    );
    await queryRunner.dropColumn(facilitiesTable, 'sensitiveNetworkId');
  }
}
