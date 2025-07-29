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

const Prescriptions = new Table({
  name: 'prescriptions',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'date',
      type: 'string',
    }),
    new TableColumn({
      name: 'endDate',
      type: 'string',
      isNullable: true,
    }),
    new TableColumn({
      name: 'note',
      type: 'string',
      isNullable: true,
    }),
    new TableColumn({
      name: 'indication',
      type: 'string',
      isNullable: true,
    }),
    new TableColumn({
      name: 'route',
      type: 'string',
      isNullable: true,
    }),
    new TableColumn({
      name: 'quantity',
      type: 'int',
    }),
    new TableColumn({
      name: 'medicationId',
      type: 'varchar',
      isNullable: true,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['medicationId'],
      referencedTableName: 'reference_data',
      referencedColumnNames: ['id'],
    }),
  ],
});

const EncounterPrescriptions = new Table({
  name: 'encounter_prescriptions',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'encounterId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'prescriptionId',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['encounterId'],
      referencedTableName: 'encounters',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['prescriptionId'],
      referencedTableName: 'prescriptions',
      referencedColumnNames: ['id'],
    }),
  ],
});

const PatientOngoingPrescriptions = new Table({
  name: 'patient_ongoing_prescriptions',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'prescriptionId',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedTableName: 'patients',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['prescriptionId'],
      referencedTableName: 'prescriptions',
      referencedColumnNames: ['id'],
    }),
  ],
});

export class changeMedicationsDBSchema1739698276000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(Prescriptions, true);
    await queryRunner.query(
      `INSERT INTO prescriptions
        SELECT 
          id,
          date,
          endDate,
          note,
          indication,
          route,
          quantity,
          medicationId,
          createdAt,
          COALESCE(updatedAt, createdAt) as updatedAt,
          updatedAtSyncTick,
          deletedAt
        FROM encounter_medications;`,
    );

    await queryRunner.createTable(EncounterPrescriptions, true);
    await queryRunner.query(
      `INSERT INTO encounter_prescriptions (encounterId, prescriptionId) SELECT encounterId, id FROM encounter_medications;`,
    );

    await queryRunner.createTable(PatientOngoingPrescriptions, true);

    await queryRunner.dropTable('encounter_medications');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const EncounterMedications = await queryRunner.getTable('encounter_medications');
    await queryRunner.createTable(EncounterMedications, true);

    await queryRunner.query(`
      INSERT INTO encounter_medications (id, encounterId, medicationId, date, endDate, prescription, note, indication, route, quantity, createdAt, updatedAt, updatedAtSyncTick, deletedAt)
      SELECT
        prescriptions.id,
        encounter_prescriptions.encounterId,
        prescriptions.medicationId,
        prescriptions.date,
        prescriptions.endDate,
        prescriptions.prescription,
        prescriptions.note,
        prescriptions.indication,
        prescriptions.route,
        prescriptions.quantity,
        prescriptions.createdAt,
        prescriptions.updatedAt,
        prescriptions.updatedAtSyncTick,
        prescriptions.deletedAt
      FROM prescriptions
      INNER JOIN encounter_prescriptions ON prescriptions.id = encounter_prescriptions.prescriptionId;
    `);

    await queryRunner.dropTable('patient_ongoing_prescriptions');
    await queryRunner.dropTable('encounter_prescriptions');
    await queryRunner.dropTable('prescriptions');
  }
}
