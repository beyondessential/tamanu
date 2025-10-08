import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

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
    type: 'date',
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
      name: 'physicianId',
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
      referencedTableName: 'encounter',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['locationId'],
      referencedTableName: 'location',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['procedureTypeId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['physicianId'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['anaesthetistId'],
      referencedTableName: 'user',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['anaestheticId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['departmentId'],
      referencedTableName: 'department',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['assistantAnaesthetistId'],
      referencedTableName: 'user',
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
      referencedTableName: 'survey_response',
      referencedColumnNames: ['id'],
    }),
  ],
});

export class addAndSyncProcedureTables1759957009000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(ProceduresTable, true);
    await queryRunner.createTable(ProcedureSurveyResponsesTable, true);

    // Trigger a full sync from the beginning of time as these tables already exist on desktop
    await queryRunner.query(`
      INSERT INTO local_system_fact (id, key, value)
      VALUES (lower(
        hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' ||
        substr(hex( randomblob(2)), 2) || '-' ||
        substr('AB89', 1 + (abs(random()) % 4) , 1)  ||
        substr(hex(randomblob(2)), 2) || '-' ||
        hex(randomblob(6))
      ), 'tablesForFullResync', 'procedures')
    `);

    await queryRunner.query(`
      INSERT INTO local_system_fact (id, key, value)
      VALUES (lower(
        hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' ||
        substr(hex( randomblob(2)), 2) || '-' ||
        substr('AB89', 1 + (abs(random()) % 4) , 1)  ||
        substr(hex(randomblob(2)), 2) || '-' ||
        hex(randomblob(6))
      ), 'tablesForFullResync', 'procedure_survey_responses')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('procedure_survey_responses', true);
    await queryRunner.dropTable('procedures', true);
  }
}
