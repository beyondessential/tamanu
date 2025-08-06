import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Set any incorrectly defaulted empty string start dates to the prescriptions "date" column
  await query.sequelize.query(`
    UPDATE prescriptions
    SET start_date = date
    WHERE start_date = ''
  `);
  // Remove the empty string default value
  await query.sequelize.query(`
    ALTER TABLE prescriptions 
    ALTER COLUMN start_date DROP DEFAULT
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    ALTER TABLE prescriptions 
    ALTER COLUMN start_date SET DEFAULT ''
  `);
}
