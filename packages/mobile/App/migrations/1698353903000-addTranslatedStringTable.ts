import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

const TABLE_NAME = 'translated_string';

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

const baseIndex = new TableIndex({
  columnNames: ['updatedAtSyncTick'],
});

const TranslatedStringTable = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'stringId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'language',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'text',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  indices: [
    baseIndex,
    new TableIndex({
      name: 'stringId_language_unique',
      columnNames: ['stringId', 'language'],
      isUnique: true,
    }),
    new TableIndex({
      name: 'stringId_index',
      columnNames: ['stringId'],
    }),
    new TableIndex({
      name: 'language_index',
      columnNames: ['language'],
    }),
  ],
});

export class addTranslatedStringTable1698353903000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(TranslatedStringTable, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
