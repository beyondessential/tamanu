import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

const TABLE_NAME = 'user_facility';

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
  new TableColumn({
    name: 'deletedAt',
    isNullable: true,
    type: 'date',
    default: null,
  }),
];

const UserFacility = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'userId',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedTableName: 'facility',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['userId'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
  ],
});

export class addUserFacilityTable1723076064000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(UserFacility, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
