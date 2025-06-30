import {
  MigrationInterface,
  TableIndex,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES = {
  SUSPECTED: 'suspected',
  UNDER_INVESTIGATION: 'underInvestigation',
  CONFIRMED: 'confirmed',
  UNKNOWN: 'unknown',
  DISPROVEN: 'disproven',
  RESOLVED: 'resolved',
  IN_REMISSION: 'inRemission',
  NOT_APPLICABLE: 'notApplicable',
  RECORDED_IN_ERROR: 'recordedInError',
};

const OLD_PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS = {
  [OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES.SUSPECTED]: 'Suspected',
  [OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNDER_INVESTIGATION]: 'Under investigation',
  [OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED]: 'Confirmed',
  [OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN]: 'Unknown',
  [OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN]: 'Disproven',
  [OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED]: 'Resolved',
  [OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES.IN_REMISSION]: 'In remission',
  [OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES.NOT_APPLICABLE]: 'Not applicable',
  [OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR]: 'Recorded in error',
};

const NEW_PROGRAM_REGISTRY_CONDITION_CATEGORY_VALUES = [
  'unknown',
  'disproven',
  'resolved',
  'recordedInError',
];

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

    const ID_PREFIX = 'program-registry-condition-category';

    const selectStatements = Object.entries(OLD_PROGRAM_REGISTRY_CONDITION_CATEGORIES).map(
      ([_, code]) => {
        const name = OLD_PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[code];
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
        '${ID_PREFIX}' || '-' || pr.id || '-' || category.code,
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
        SELECT prcc.id
        FROM patient_program_registration_conditions pprc
        JOIN patient_program_registrations ppr ON pprc.patientProgramRegistrationId = ppr.id
        JOIN program_registry_condition_categories prcc
          ON pprc.conditionCategory = prcc.code
          AND prcc.programRegistryId = ppr.programRegistryId
        WHERE pprc.id = patient_program_registration_conditions.id
      )
    `);

    const newCategoriesClause = NEW_PROGRAM_REGISTRY_CONDITION_CATEGORY_VALUES
      .map((code) => `'${code}'`)
      .join(',');

    // Remove all unused categories per registry not in the new list
    await queryRunner.query(`
      DELETE FROM program_registry_condition_categories
      WHERE code NOT IN (${newCategoriesClause})
      AND id NOT IN (SELECT programRegistryConditionCategoryId FROM patient_program_registration_conditions)
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

    // Remove the conditionCategory column
    await queryRunner.dropColumn(table, 'conditionCategory');
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
