import { QueryInterface } from 'sequelize';

/**
 * This migration exists to prepare data before the preceding DDL migration is rolled back. It would
 * actually be harmless to convert empty strings to NULL; I’ve just opted to make the up-migration
 * more conservative and have the application layer treat empty string and NULL both as “unitless”.
 */
export async function up(): Promise<void> {}

/* Companion to 1784600000000-makePrescriptionUnitColumnsNullable */
export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(
    "UPDATE prescriptions SET dosing_unit = '' WHERE dosing_unit IS NULL;",
  );
  await queryInterface.sequelize.query(
    "UPDATE prescriptions SET dispensing_unit = '' WHERE dispensing_unit IS NULL;",
  );
}
