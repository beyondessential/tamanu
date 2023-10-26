import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';
import { BaseColumns, baseIndex } from './utils/baseColumns';

const ISO9075_DATE_FORMAT = 'YYYY-MM-DD';
const ISO9075_DATE_FORMAT_LENGTH = ISO9075_DATE_FORMAT.length;

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
