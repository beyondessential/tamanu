import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
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

const TaskEncounterPrescriptionsTable = new Table({
  name: 'task_encounter_prescriptions',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'taskId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'encounterPrescriptionId',
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
      columnNames: ['encounterPrescriptionId'],
      referencedTableName: 'encounter_prescriptions',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [
    new TableIndex({
      name: 'task_encounter_prescriptions_task_encounter_unique',
      columnNames: ['taskId', 'encounterPrescriptionId'],
      isUnique: true,
    }),
  ],
});

export class createTaskEncounterPrescriptionTable1754462481000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(TaskEncounterPrescriptionsTable, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('task_encounter_prescriptions', true);
  }
} 