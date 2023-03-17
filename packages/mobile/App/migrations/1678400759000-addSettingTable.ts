import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

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
    name: 'updatedAtSyncTick',
    type: 'bigint',
    isNullable: false,
    default: -999,
  }),
];

const SettingTable = new Table({
  name: 'setting',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'key',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'value',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedTableName: 'facility',
      referencedColumnNames: ['id'],
    }),
  ],
});

const ifNotExist = true;

const updatedAtSyncTickIndex = {
  columnNames: ['updatedAtSyncTick'],
};

export class addSettingTable1678400759000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(SettingTable, ifNotExist);

    await queryRunner.createIndex(SettingTable, new TableIndex(updatedAtSyncTickIndex));

  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(SettingTable);
  }
}
