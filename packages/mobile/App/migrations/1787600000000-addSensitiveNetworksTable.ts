import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

const TABLE_NAME = 'sensitive_networks';

const BaseColumns = [
  new TableColumn({
    name: 'id',
    type: 'varchar',
    isPrimary: true,
  }),
  new TableColumn({
    name: 'createdAt',
    type: 'datetime',
    default: "datetime('now')",
  }),
  new TableColumn({
    name: 'updatedAt',
    type: 'datetime',
    default: "datetime('now')",
  }),
  new TableColumn({
    name: 'deletedAt',
    type: 'datetime',
    default: null,
    isNullable: true,
  }),
  new TableColumn({
    name: 'updatedAtSyncTick',
    type: 'bigint',
    isNullable: false,
    default: -999,
  }),
];

// spec: specs/sync/sensitive-networks.md
const SensitiveNetworksTable = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: false,
    }),
  ],
});

export class addSensitiveNetworksTable1787600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(SensitiveNetworksTable, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
