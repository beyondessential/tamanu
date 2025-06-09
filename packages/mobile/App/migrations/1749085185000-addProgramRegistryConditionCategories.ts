import {
  MigrationInterface,
  TableIndex,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '~/constants/programRegistries';

const TABLE_NAME = 'program_registry_condition_categories';

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

const ProgramRegistryConditionCategory = new Table({
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
      referencedTableName: 'program_registries',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

export class addProgramRegistryConditionCategories1749085185000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(ProgramRegistryConditionCategory, true);

    const ID_PREFIX = 'program-registry-condition-category-';

    const selectStatements = Object.entries(PROGRAM_REGISTRY_CONDITION_CATEGORIES).map(
      ([_, code]) => {
        const name = PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[code];
        if (!name) {
          throw new Error(`Missing label for category code: ${code}`);
        }
        return `SELECT '${code}' as code, '${name}' as name`;
      },
    );

    const unionQuery = selectStatements.join(' UNION ALL ');

    // Insert hard coded categories for each existing program registry
    await queryRunner.query(`
      INSERT INTO program_registry_condition_categories (
        id, code, name, visibilityStatus, programRegistryId, createdAt, updatedAt
      )
      SELECT
        '${ID_PREFIX}' || pr.code || '-' || category.code,
        category.code,
        category.name,
        'current',
        pr.id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM program_registries pr
      CROSS JOIN (
        ${unionQuery}
      ) AS category
    `);

    // Get the patient_program_registration_conditions table
    const table = await queryRunner.getTable('patient_program_registration_conditions');

    // Remove the conditionCategory column
    await queryRunner.dropColumn(table, 'conditionCategory');

    // Add the programRegistryConditionCategoryId column
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'programRegistryConditionCategoryId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // Set the values for existing records
    await queryRunner.query(`
      UPDATE patient_program_registration_conditions
      SET programRegistryConditionCategoryId = (
        SELECT prc.id
        FROM program_registry_condition_categories prc
        JOIN patient_program_registrations ppr ON prc.programRegistryId = ppr.programRegistryId
        WHERE ppr.id = patient_program_registration_conditions.patientProgramRegistrationId
        AND prc.code = 'unknown'
        LIMIT 1
      )
    `);

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      table,
      new TableForeignKey({
         columnNames: ['programRegistryConditionCategoryId'],
         referencedTableName: 'program_registry_condition_categories',
         referencedColumnNames: ['id'],
       }),
    );

    // Now make the column non-nullable
    await queryRunner.changeColumn(
      table,
      'programRegistryConditionCategoryId',
      new TableColumn({
        name: 'programRegistryConditionCategoryId',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Get the patient_program_registration_conditions table
    const table = await queryRunner.getTable('patient_program_registration_conditions');

    // Drop the foreign key constraint
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('programRegistryConditionCategoryId') !== -1,
    );
    await queryRunner.dropForeignKey(table, foreignKey);

    // Drop the programRegistryConditionCategoryId column
    await queryRunner.dropColumn(table, 'programRegistryConditionCategoryId');

    // Add back the conditionCategory column
    await queryRunner.addColumn(
      table,
      new TableColumn({
        name: 'conditionCategory',
        type: 'text',
        isNullable: false,
        default: "'unknown'",
      }),
    );

    // Drop the program_registry_condition_categories table
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
