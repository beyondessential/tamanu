import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

const PRESCRIPTIONS_TABLE = 'prescriptions';
const ENCOUNTER_PRESCRIPTIONS_TABLE = 'encounter_prescriptions';

export class updateMedicationsDBSchema1750786972719 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      ENCOUNTER_PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'isSelectedForDischarge',
        type: 'boolean',
        isNullable: false,
        default: false,
      }),
    );

    await queryRunner.renameColumn(PRESCRIPTIONS_TABLE, 'note', 'notes');
    await queryRunner.changeColumn(
      PRESCRIPTIONS_TABLE,
      'quantity',
      new TableColumn({
        name: 'quantity',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'isOngoing',
        type: 'boolean',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'isPrn',
        type: 'boolean',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'isVariableDose',
        type: 'boolean',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'doseAmount',
        type: 'decimal',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'units',
        type: 'string',
        isNullable: false,
        default: "''",
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'frequency',
        type: 'string',
        isNullable: false,
        default: "''",
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'startDate',
        type: 'string',
        isNullable: false,
        default: "''",
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'durationValue',
        type: 'decimal',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'durationUnit',
        type: 'string',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'isPhoneOrder',
        type: 'boolean',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'idealTimes',
        type: 'string',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'pharmacyNotes',
        type: 'string',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'displayPharmacyNotesInMar',
        type: 'boolean',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'prescriberId',
        type: 'string',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      PRESCRIPTIONS_TABLE,
      new TableForeignKey({
        columnNames: ['prescriberId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'discontinued',
        type: 'boolean',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'discontinuingClinicianId',
        type: 'string',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      PRESCRIPTIONS_TABLE,
      new TableForeignKey({
        columnNames: ['discontinuingClinicianId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'discontinuingReason',
        type: 'string',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'discontinuedDate',
        type: 'string',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      PRESCRIPTIONS_TABLE,
      new TableColumn({
        name: 'repeats',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(ENCOUNTER_PRESCRIPTIONS_TABLE, 'isSelectedForDischarge');
    await queryRunner.renameColumn(PRESCRIPTIONS_TABLE, 'notes', 'note');
    await queryRunner.changeColumn(
      PRESCRIPTIONS_TABLE,
      'quantity',
      new TableColumn({
        name: 'quantity',
        type: 'int',
        isNullable: false,
      }),
    );
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'isOngoing');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'isPrn');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'isVariableDose');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'doseAmount');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'units');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'frequency');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'startDate');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'durationValue');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'durationUnit');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'isPhoneOrder');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'idealTimes');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'pharmacyNotes');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'displayPharmacyNotesInMar');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'prescriberId');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'discontinued');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'discontinuingClinicianId');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'discontinuingReason');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'discontinuedDate');
    await queryRunner.dropColumn(PRESCRIPTIONS_TABLE, 'repeats');
  }
}
