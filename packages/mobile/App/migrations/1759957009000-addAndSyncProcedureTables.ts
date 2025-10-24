import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

import { triggerFullResync } from './utils/triggerFullResync';

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
    name: 'deletedAt',
    isNullable: true,
    type: 'datetime',
    default: null,
  }),
  new TableColumn({
    name: 'updatedAtSyncTick',
    type: 'bigint',
    isNullable: false,
    default: -999,
  }),
];

const ProceduresTable = new Table({
  name: 'procedures',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'completed',
      type: 'boolean',
      default: false,
    }),
    new TableColumn({
      name: 'date',
      type: 'date',
      isNullable: false,
    }),
    new TableColumn({
      name: 'endTime',
      type: 'datetime',
      isNullable: true,
    }),
    new TableColumn({
      name: 'startTime',
      type: 'datetime',
      isNullable: true,
    }),
    new TableColumn({
      name: 'note',
      type: 'text',
      isNullable: true,
    }),
    new TableColumn({
      name: 'completedNote',
      type: 'text',
      isNullable: true,
    }),
    new TableColumn({
      name: 'timeIn',
      type: 'datetime',
      isNullable: true,
    }),
    new TableColumn({
      name: 'timeOut',
      type: 'datetime',
      isNullable: true,
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'locationId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'procedureTypeId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'leadClinicianId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'anaesthetistId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'anaestheticId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'departmentId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'assistantAnaesthetistId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounters',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['locationId'],
      referencedTableName: 'locations',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['procedureTypeId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['leadClinicianId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['anaesthetistId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['anaestheticId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['departmentId'],
      referencedTableName: 'departments',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['assistantAnaesthetistId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
  ],
});

const ProcedureSurveyResponsesTable = new Table({
  name: 'procedure_survey_responses',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'procedureId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'surveyResponseId',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['procedureId'],
      referencedTableName: 'procedures',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['surveyResponseId'],
      referencedTableName: 'survey_responses',
      referencedColumnNames: ['id'],
    }),
  ],
});

export class addAndSyncProcedureTables1759957009000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(ProceduresTable, true);
    await queryRunner.createTable(ProcedureSurveyResponsesTable, true);

    // Trigger a full sync from the beginning of time as these tables already exist on desktop
    await triggerFullResync(queryRunner, ['procedures', 'procedure_survey_responses']);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('procedure_survey_responses', true);
    await queryRunner.dropTable('procedures', true);
  }
}
