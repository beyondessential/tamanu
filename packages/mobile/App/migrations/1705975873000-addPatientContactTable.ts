import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

const TABLE_NAME = 'patient_contact';
const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

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
];

const PatientContact = new Table({
  name: TABLE_NAME,
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'method',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'address',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'deletionStatus',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedTableName: 'patient',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['relationshipId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
});

export class addPatientContactTable1705975873000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(PatientContact, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
