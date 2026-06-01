import { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(
    `UPDATE reference_drugs SET dosing_unit = units, dispensing_unit = units`,
  );
  await queryInterface.sequelize.query(
    `UPDATE prescriptions SET dosing_unit = units, dispensing_unit = units`,
  );
  await queryInterface.sequelize.query(
    `UPDATE reference_medication_templates SET dosing_unit = units`,
  );
}

export async function down(): Promise<void> {
  // No safe reversal — units column still populated until the next migration runs
}
