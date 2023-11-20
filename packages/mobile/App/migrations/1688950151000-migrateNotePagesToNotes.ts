import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

const ISO9075_DATE_FORMAT = 'YYYY-MM-DD';
const ISO9075_DATE_FORMAT_LENGTH = ISO9075_DATE_FORMAT.length;

const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

const baseIndex = new TableIndex({
  columnNames: ['updatedAtSyncTick'],
});

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

const NoteTable = new Table({
  name: 'note',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'noteType',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'date',
      type: 'varchar',
      length: `${ISO9075_DATE_FORMAT_LENGTH}`,
      isNullable: false,
      default: "date('now')",
    }),
    new TableColumn({
      name: 'recordType',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'recordId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'content',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'revisedById',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'authorId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'onBehalfOfId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['authorId'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['onBehalfOfId'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

export class migrateNotePagesToNotes1688950151000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(NoteTable);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('note');
  }
}
