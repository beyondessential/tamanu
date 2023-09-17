import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

const ISO9075_DATE_FORMAT = 'YYYY-MM-DD';
const ISO9075_DATE_FORMAT_LENGTH = ISO9075_DATE_FORMAT.length;

const ISO9075_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const ISO9075_FORMAT_LENGTH = ISO9075_FORMAT.length;

const baseIndex = new TableIndex({
  columnNames: ['updatedAtSyncTick'],
});

const BaseColumns = [
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

const PatientFieldDefinitionCategoryTable = new Table({
  name: 'patient_field_definition_category',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'id',
      type: 'varchar',
      isPrimary: true,
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  indices: [baseIndex],
});

const PatientFieldDefinitionTable = new Table({
  name: 'patient_field_definition',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'id',
      type: 'varchar',
      isPrimary: true,
    }),
    new TableColumn({
      name: 'name',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'fieldType',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'options',
      type: 'varchar',
      isNullable: true,
    }),
    new TableColumn({
      name: 'categoryId',
      type: 'varchar',
      isNullable: false,
    }),
    new TableColumn({
      name: 'visibilityStatus',
      type: 'varchar',
      isNullable: false,
    }),
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['categoryId'],
      referencedTableName: 'patient_field_definition_category',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

const PatientFieldValueTable = new Table({
  name: 'patient_field_value',
  columns: [
    ...BaseColumns,
    new TableColumn({
      name: 'value',
      type: 'text',
      isNullable: false,
    }),
    new TableColumn({
      name: 'patientId',
      type: 'varchar',
      isNullable: false,
      isPrimary: true,
    }),
    new TableColumn({
      name: 'definitionId',
      type: 'varchar',
      isNullable: false,
      isPrimary: true,
    }),
    new TableColumn({
      name: 'id',
      type: 'text',
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
      columnNames: ['definitionId'],
      referencedTableName: 'patient_field_definition',
      referencedColumnNames: ['id'],
    }),
  ],
  indices: [baseIndex],
});

export class addPatientCustomFieldsTables1694090332843 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(PatientFieldDefinitionCategoryTable);
    await queryRunner.createTable(PatientFieldDefinitionTable);
    await queryRunner.createTable(PatientFieldValueTable);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(PatientFieldValueTable);
    await queryRunner.dropTable(PatientFieldDefinitionTable);
    await queryRunner.dropTable(PatientFieldDefinitionCategoryTable);
  }
}
