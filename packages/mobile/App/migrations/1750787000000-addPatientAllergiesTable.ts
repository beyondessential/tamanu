import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

const TABLE_NAME = 'patient_allergies';

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
    type: 'datetime',
    default: null,
    isNullable: true,
  }),
  new TableColumn({
    name: 'updatedAtSyncTick',
    type: 'bigint',
    isNullable: false,
    default: -999,
  }),
];

const PatientAllergiesTable = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'note',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'recordedDate',
      type: 'string',
      isNullable: false,
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'practitionerId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'allergyId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'reactionId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedTableName: 'patients',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['practitionerId'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['allergyId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['reactionId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
});

export class addPatientAllergiesTable1750787000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(PatientAllergiesTable, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
