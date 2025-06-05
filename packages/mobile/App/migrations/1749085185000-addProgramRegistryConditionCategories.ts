import {
  MigrationInterface,
  TableIndex,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';
// Todod: Update to mobile constants
import { VISIBILITY_STATUSES } from '@tamanu/constants';

const TABLE_NAME = 'program_registry_condition_category';

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
      referencedTableName: 'program_registry',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

export class addProgramRegistryConditionCategories1749085185000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(ProgramRegistryConditionCategory, true);

    const ID_PREFIX = 'program-registry-condition-category-';

    // Insert hard coded categories for each existing program registry
    await queryRunner.query(`
      INSERT INTO program_registry_condition_category (id, code, name, visibility_status, program_registry_id, created_at, updated_at)
      SELECT
        CONCAT('${ID_PREFIX}', pr.code, '-', category.code),
        category.code,
        category.name,
        '${VISIBILITY_STATUSES.CURRENT}',
        pr.id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM program_registries pr
             CROSS JOIN (
        VALUES
          ('disproven', 'Disproven'),
          ('resolved', 'Resolved'),
          ('recordedInError', 'RecordedInError'),
          ('unknown', 'Unknown')
      ) AS category(code, name)
    `);

    // Get the patient_program_registration_conditions table
    const table = await queryRunner.getTable('patient_program_registration_condition');

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
      UPDATE patient_program_registration_condition
      SET programRegistryConditionCategoryId = (
        SELECT prc.id
        FROM program_registry_condition_category prc
        JOIN patient_program_registration ppr ON prc.programRegistryId = ppr.programRegistryId
        WHERE ppr.id = patient_program_registration_condition.patientProgramRegistrationId
        AND prc.code = 'unknown'
        LIMIT 1
      )
    `);

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

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      table,
      new TableForeignKey({
        columnNames: ['programRegistryConditionCategoryId'],
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
        type: 'string',
        isNullable: false,
        default: "'unknown'",
      }),
    );

    // Drop the program_registry_condition_category table
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
