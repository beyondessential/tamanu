import {
  MigrationInterface,
  TableIndex,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'patient_program_registration_conditions';
const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

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
    type: 'datetime',
    isNullable: true,
  }),
];

const PatientProgramRegistrationConditions = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'date',
      type: 'varchar',
      length: `${ISO9075_FORMAT_LENGTH}`,
      isNullable: false,
      default: "date('now')",
    }),
    new TableColumn({
      name: 'deletionDate',
      type: 'varchar',
      length: `${ISO9075_FORMAT_LENGTH}`,
      isNullable: true,
      default: "date('now')",
    }),
    new TableColumn({
      name: 'deletionClinicianId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'clinicianId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'programRegistryConditionId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'programRegistryId',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'patients',
    }),
    new TableForeignKey({
      columnNames: ['programRegistryId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'program_registries',
    }),
    new TableForeignKey({
      columnNames: ['programRegistryConditionId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'program_registry_conditions',
    }),
    new TableForeignKey({
      columnNames: ['deletionClinicianId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'user',
    }),
    new TableForeignKey({
      columnNames: ['clinicianId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'user',
    }),
  ],
  indices: [baseIndex],
});
export class addPatientProgramRegistrationConditions1706509624000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(PatientProgramRegistrationConditions, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
