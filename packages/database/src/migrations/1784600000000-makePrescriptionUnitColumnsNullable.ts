import { QueryInterface } from 'sequelize';

/**
 * Use raw `ALTER` because `changeColumn` re-emits full column definition including `ALTER COLUMN …
 * TYPE VARCHAR(255)`. Even when the type is unchanged, Postgres rebuilds dependents and fails if a
 * reporting view references the column.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(`
    ALTER TABLE prescriptions
      ALTER COLUMN dosing_unit DROP NOT NULL,
      ALTER COLUMN dispensing_unit DROP NOT NULL;
  `);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(`
    ALTER TABLE prescriptions
      ALTER COLUMN dosing_unit SET NOT NULL,
      ALTER COLUMN dispensing_unit SET NOT NULL;
  `);
}
