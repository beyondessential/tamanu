import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const tableName = 'patient_additional_data';

export class addMotherFatherIdToPatientAdditionalData1756663661549 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Temporarily disable foreign key constraints
    await queryRunner.query('PRAGMA foreign_keys = OFF;');

    const tableObject = await queryRunner.getTable(tableName);

    // Check if columns already exist to avoid errors
    const existingColumns = tableObject.columns.map(col => col.name);

    // Add motherId column if it doesn't exist
    if (!existingColumns.includes('motherId')) {
      await queryRunner.addColumn(
        tableObject,
        new TableColumn({
          name: 'motherId',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    // Add fatherId column if it doesn't exist
    if (!existingColumns.includes('fatherId')) {
      await queryRunner.addColumn(
        tableObject,
        new TableColumn({
          name: 'fatherId',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

        // Note: Foreign key constraints are handled by TypeORM at the application level
    // Not creating database-level foreign keys to avoid constraint violations during data sync

    // Re-enable foreign key constraints
    await queryRunner.query('PRAGMA foreign_keys = ON;');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const tableObject = await queryRunner.getTable(tableName);

    // Drop columns (no foreign keys to drop since we don't create them)
    const existingColumns = tableObject.columns.map(col => col.name);

    if (existingColumns.includes('motherId')) {
      await queryRunner.dropColumn(tableObject, 'motherId');
    }

    if (existingColumns.includes('fatherId')) {
      await queryRunner.dropColumn(tableObject, 'fatherId');
    }
  }
}
