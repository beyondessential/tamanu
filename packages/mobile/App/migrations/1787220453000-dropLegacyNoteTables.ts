import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const commonColumns = [
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

const deletedAtColumn = new TableColumn({
  name: 'deletedAt',
  type: 'date',
  isNullable: true,
  default: null,
});

const notePagesTable = new Table({
  name: 'note_pages',
  columns: [
    ...commonColumns,
    new TableColumn({
      name: 'noteType',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'date',
      type: 'varchar',
      length: '10',
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
    deletedAtColumn,
  ],
});

const noteItemsTable = new Table({
  name: 'note_items',
  columns: [
    ...commonColumns,
    new TableColumn({
      name: 'date',
      type: 'varchar',
      length: '19',
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
    deletedAtColumn,
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['notePageId'],
      referencedTableName: 'note_pages',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['authorId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['onBehalfOfId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
  ],
});

/**
 * - The two-level note schema (`note_pages` + `note_items`) was replaced by the flat `notes` table in
 *   #4386, with data migrated centrally.
 * - `LegacyNotePage` & `LegacyNoteItem` models were deleted in #6217.
 * - These tables have been dead since. Nothing reads, writes (or syncs) them.
 * - Hilariously, `standardiseCaseAndPluralityOfAllTables` migration dutifully renamed them anyway.
 * @see https://github.com/beyondessential/tamanu/pull/4386
 * @see https://github.com/beyondessential/tamanu/pull/6217
 * @see `1734080053767-standardiseCaseAndPluralityOfAllTables`
 */
export class dropLegacyNoteTables1787220453000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // note_items has a foreign key to note_pages, so drop it first
    await queryRunner.dropTable('note_items', true);
    await queryRunner.dropTable('note_pages', true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(notePagesTable, true);
    await queryRunner.createTable(noteItemsTable, true);
  }
}
