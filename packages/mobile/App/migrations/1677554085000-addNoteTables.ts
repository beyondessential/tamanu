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

const NotePageTable = new Table({
  name: 'notePage',
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
  ],
  // Can't use foreign keys as recordId could refer to any of a few tables
  // foreignKeys: [],
  indices: [baseIndex],
});

const NoteItemTable = new Table({
  name: 'noteItem',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'date',
      type: 'varchar',
      length: `${ISO9075_FORMAT_LENGTH}`,
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
      name: 'notePageId',
      type: 'varchar',
      isNullable: false,
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
      columnNames: ['notePageId'],
      referencedTableName: 'notePage',
      referencedColumnNames: ['id'],
    }),
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

export class addNoteTables1677554085000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(NotePageTable);
    await queryRunner.createTable(NoteItemTable);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(NoteItemTable);
    await queryRunner.dropTable(NotePageTable);
  }
}
