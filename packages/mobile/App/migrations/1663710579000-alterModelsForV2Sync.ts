import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
  TableForeignKey,
} from 'typeorm';
import { readConfig } from '~/services/config';
import { TABLE_DEFINITIONS } from './firstTimeSetup/databaseDefinition';
import { getTable } from './utils/queryRunner';

const ifExists = false;
const ifNotExists = false;

const updatedAtSyncTickIndex = {
  columnNames: ['updatedAtSyncTick'],
};

const markedForUploadIndex = {
  columnNames: ['markedForUpload'],
};

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

const LocalSystemFactTable = new Table({
  name: 'local_system_fact',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'key',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'value',
      type: 'varchar',
    }),
  ],
  indices: [updatedAtSyncTickIndex],
});

const PatientFacilitiesTable = new Table({
  name: 'patient_facility',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
    }),
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['patientId'],
      referencedTableName: 'patient',
      referencedColumnNames: ['id'],
    }),
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedTableName: 'facility',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [updatedAtSyncTickIndex],
});

export class alterModelsForV2Sync1663710579000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of TABLE_DEFINITIONS.map(t => t.name)) {
      const table = await getTable(queryRunner, tableName);

      // remove column markedForUpload from all tables
      await queryRunner.dropColumn(table, 'markedForUpload');

      // remove column uploadedAt from all tables
      await queryRunner.dropColumn(table, 'uploadedAt');

      // add column updatedAtSyncTick to every model
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'updatedAtSyncTick',
          type: 'bigint',
          isNullable: true,
          default: -999,
        }),
      );

      // add index on updatedAtSyncTick to every model
      await queryRunner.createIndex(table, new TableIndex(updatedAtSyncTickIndex));
    }

    // remove column markedForSync from patient_additional_data
    await queryRunner.dropColumn('patient_additional_data', 'markedForSync');

    // add table local_system_fact
    await queryRunner.createTable(LocalSystemFactTable, ifNotExists);

    // add table patient_facility
    await queryRunner.createTable(PatientFacilitiesTable, ifNotExists);

    // add entries in patient_facility for any patient marked for sync
    const facilityId = await readConfig('facilityId');
    if (facilityId) {
      await queryRunner.query(`
        INSERT INTO "patient_facility" ("id", "patientId", "facilityId", "updatedAtSyncTick")
        SELECT REPLACE("patient"."id", ';', ':') || ';' || REPLACE('${facilityId}', ';', ':'), "patient"."id", '${facilityId}', 0 -- updated_at_sync_tick of 0 will be included in first push
        FROM "patient"
        WHERE "patient"."markedForSync" = 1;
      `);
    }

    // remove column markedForSync from Patient
    await queryRunner.dropColumn('patient', 'markedForSync');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of TABLE_DEFINITIONS.map(t => t.name)) {
      const table = await getTable(queryRunner, tableName);

      // remove column updatedAtSyncTick from all tables
      await queryRunner.dropColumn(table, 'updatedAtSyncTick');

      // add column markedForUpload to every model
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'markedForUpload',
          type: 'boolean',
          default: 1,
        }),
      );

      // add column upoadedAt to every model
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'uploadedAt',
          type: 'datetime',
          isNullable: true,
        }),
      );

      // add index on markedForUpload to every model
      await queryRunner.createIndex(table, new TableIndex(markedForUploadIndex));
    }

    // add column markedForSync to patient_additional_data
    const patientAdditionalDataTable = await getTable(queryRunner, 'patient_additional_data');
    await queryRunner.addColumn(
      patientAdditionalDataTable,
      new TableColumn({
        name: 'markedForSync',
        type: 'boolean',
        default: 0,
      }),
    );

    // add column markedForSync to patient
    const patientTable = await getTable(queryRunner, 'patient');
    await queryRunner.addColumn(
      patientTable,
      new TableColumn({
        name: 'markedForSync',
        type: 'boolean',
        default: 0,
      }),
    );

    // drop table local_system_fact
    await queryRunner.dropTable('local_system_fact', ifExists);

    // drop table patient_facility
    await queryRunner.dropTable('patient_facility', ifExists);
  }
}
