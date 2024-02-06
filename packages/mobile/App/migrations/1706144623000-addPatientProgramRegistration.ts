import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

const TABLE_NAME = 'patient_program_registration';
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
    isNullable: true,
    type: 'date',
    default: null,
  }),
];

const PatientProgramRegistration = new Table({
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
      name: 'registrationStatus',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'programRegistryId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'clinicalStatusId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'clinicianId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'registeringFacilityId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'villageId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'patient',
    }),
    new TableForeignKey({
      columnNames: ['programRegistryId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'program_registry',
    }),
    new TableForeignKey({
      columnNames: ['clinicalStatusId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'program_registry_clinical_status',
    }),
    new TableForeignKey({
      columnNames: ['clinicianId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'user',
    }),
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'facility',
    }),
    new TableForeignKey({
      columnNames: ['registeringFacilityId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'facility',
    }),
    new TableForeignKey({
      columnNames: ['villageId'],
      referencedColumnNames: ['id'],
      referencedTableName: 'reference_data',
    }),
  ],
  indices: [baseIndex],
});

export class addPatientProgramRegistration1706144623000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(PatientProgramRegistration, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
