import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

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
    name: 'deletedAt',
    isNullable: true,
    type: 'datetime',
    default: null,
  }),
  new TableColumn({
    name: 'updatedAtSyncTick',
    type: 'bigint',
    isNullable: false,
    default: -999,
  }),
];

const ReferenceDrugFacilityTable = new Table({
  name: 'reference_drug_facility',
  columns: [
    new TableColumn({
      name: 'id',
      type: `TEXT GENERATED ALWAYS AS (REPLACE(referenceDrugId, ';', ':') || ';' || REPLACE(facilityId, ';', ':')) STORED`,
    }),
    new TableColumn({
      name: 'referenceDrugId',
      type: 'varchar',
      isPrimary: true,
    }),
    new TableColumn({
      name: 'facilityId',
      type: 'varchar',
      isPrimary: true,
    }),
    new TableColumn({
      name: 'quantity',
      type: 'varchar',
      isNullable: true,
      comment: 'Stock level (number as string), "unavailable", or NULL for unknown',
    }),
    ...BaseColumns,
  ],
  foreignKeys: [
    new TableForeignKey({
      columnNames: ['referenceDrugId'],
      referencedTableName: 'reference_drugs',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }),
    new TableForeignKey({
      columnNames: ['facilityId'],
      referencedTableName: 'facilities',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }),
  ],
});

export class addReferenceDrugFacilityTable1764835543000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(ReferenceDrugFacilityTable, true);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(ReferenceDrugFacilityTable);
  }
}
