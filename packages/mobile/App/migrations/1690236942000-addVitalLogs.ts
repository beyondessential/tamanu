import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

const TABLE_NAME = 'vital_log';
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

const VitalLog = new Table({
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
      name: 'previousValue',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'newValue',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'reasonForChange',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'recordedById',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'answerId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['recordedById'],
      referencedColumnNames: ['id'],
      referencedTableName: 'user',
    }),
    new TableForeignKey({
      columnNames: ['answerId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'survey_response_answer',
    }),
  ],
  indices: [
    new TableIndex({
      name: 'vital_log_updated_at_sync_tick',
      columnNames: ['updatedAtSyncTick'],
    }),
  ],
});

export class addVitalLogs1690236942000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(VitalLog, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
