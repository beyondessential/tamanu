import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

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

const TasksTable = new Table({
  name: 'tasks',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'name',
      type: 'text',
      isNullable: false,
    }),
    new TableColumn({
      name: 'dueTime',
      type: 'string',
      isNullable: false,
    }),
    new TableColumn({
      name: 'endTime',
      type: 'string',
      isNullable: true,
    }),
    new TableColumn({
      name: 'requestTime',
      type: 'string',
      isNullable: false,
    }),
    new TableColumn({
      name: 'status',
      type: 'varchar',
      isNullable: false,
      default: "'todo'",
    }),
    new TableColumn({
      name: 'note',
      type: 'text',
      isNullable: true,
    }),
    new TableColumn({
      name: 'frequencyValue',
      type: 'decimal',
      isNullable: true,
    }),
    new TableColumn({
      name: 'frequencyUnit',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'durationValue',
      type: 'decimal',
      isNullable: true,
    }),
    new TableColumn({
      name: 'durationUnit',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'highPriority',
      type: 'boolean',
      isNullable: true,
    }),
    new TableColumn({
      name: 'parentTaskId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'completedTime',
      type: 'string',
      isNullable: true,
    }),
    new TableColumn({
      name: 'completedNote',
      type: 'text',
      isNullable: true,
    }),
    new TableColumn({
      name: 'notCompletedTime',
      type: 'string',
      isNullable: true,
    }),
    new TableColumn({
      name: 'todoTime',
      type: 'string',
      isNullable: true,
    }),
    new TableColumn({
      name: 'todoNote',
      type: 'text',
      isNullable: true,
    }),
    new TableColumn({
      name: 'deletedTime',
      type: 'string',
      isNullable: true,
    }),
    new TableColumn({
      name: 'taskType',
      type: 'varchar',
      isNullable: false,
      default: "'normal_task'",
    }),
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'requestedByUserId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'completedByUserId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'notCompletedByUserId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'todoByUserId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'deletedByUserId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'notCompletedReasonId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'deletedReasonId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'deletedReasonForSyncId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['parentTaskId'],
      referencedTableName: 'tasks',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounters',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['requestedByUserId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['completedByUserId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['notCompletedByUserId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['todoByUserId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['deletedByUserId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['notCompletedReasonId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['deletedReasonId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['deletedReasonForSyncId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
});

const TaskDesignationsTable = new Table({
  name: 'task_designations',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'taskId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'designationId',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['taskId'],
      referencedTableName: 'tasks',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['designationId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
});

export class addTaskTables1754000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(TasksTable, true);
    await queryRunner.createTable(TaskDesignationsTable, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('task_designations', true);
    await queryRunner.dropTable('tasks', true);
  }
}
