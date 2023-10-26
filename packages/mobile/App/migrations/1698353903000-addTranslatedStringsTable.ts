import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

const BaseColumns = [
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

const TranslatedStringTable = new Table({
  name: 'translated_string',
  // Use all except the first column (id)
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'id',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'key',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'language',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'value',
      type: 'varchar',
      isNullable: false,
    }),
  ],
});

export class addTranslatedStringsTable1698353903000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {}

  async down(queryRunner: QueryRunner): Promise<void> {}
}
