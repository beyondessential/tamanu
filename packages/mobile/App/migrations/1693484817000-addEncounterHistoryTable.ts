import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

const TABLE_NAME = 'encounter_history';
const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

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

const EncounterHistory = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'date',
      type: 'varchar',
      length: `${ISO9075_FORMAT_LENGTH}`,
      isNullable: false,
      default: "date('now')",
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'examinerId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'departmentId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'actorId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'locationId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'encounterType',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'changeType',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['actorId'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['examinerId'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['departmentId'],
      referencedTableName: 'department',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['locationId'],
      referencedTableName: 'location',
      referencedColumnNames: ['id'],
    }),
  ],
});

export class addEncounterHistoryTable1693484817000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(EncounterHistory, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
