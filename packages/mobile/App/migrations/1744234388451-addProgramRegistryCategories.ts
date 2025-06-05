import {
  MigrationInterface,
  TableIndex,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'program_registry_category';

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
  new TableColumn({
    name: 'deletedAt',
    isNullable: true,
    type: 'date',
    default: null,
  }),
];

const ProgramRegistryCategory = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'code',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'programRegistryId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['programRegistryId'],
      referencedTableName: 'program_registry',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

export class addProgramRegistryCategories1744234388451 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(ProgramRegistryCategory, true);

    // Get the patient_program_registration_conditions table
    const table = await queryRunner.getTable('patient_program_registration_condition');

    // Remove the conditionCategory column
    await queryRunner.dropColumn(table, 'conditionCategory');

    // Add the programRegistryCategoryId column
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'programRegistryCategoryId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      table,
      new TableForeignKey({
        columnNames: ['programRegistryCategoryId'],
        referencedTableName: TABLE_NAME,
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Get the patient_program_registration_condition table
    const table = await queryRunner.getTable('patient_program_registration_condition');

    // Drop the foreign key constraint
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('programRegistryCategoryId') !== -1,
    );
    await queryRunner.dropForeignKey(table, foreignKey);

    // Drop the programRegistryCategoryId column
    await queryRunner.dropColumn(table, 'programRegistryCategoryId');

    // Add back the conditionCategory column
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'conditionCategory',
        type: 'string',
        isNullable: false,
        default: "'unknown'",
      }),
    );

    // Drop the program_registry_category table
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
