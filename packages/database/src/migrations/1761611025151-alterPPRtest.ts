import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  // Bump both dates by 1 second
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET date = '2025-10-28 10:29:13'
    WHERE date = '2025-10-28 10:29:12';
  `);

  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET date = '2025-10-28 10:57:55'
    WHERE date = '2025-10-28 10:57:54';
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET date = '2025-10-28 10:29:12'
    WHERE date = '2025-10-28 10:29:13';
  `);

  await query.sequelize.query(`
    UPDATE patient_program_registrations
    SET date = '2025-10-28 10:57:54'
    WHERE date = '2025-10-28 10:57:55';
  `);
}
