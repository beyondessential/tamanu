import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `
    UPDATE settings
    SET key = 'features.covidCertificates.enableCovidClearanceCertificate'
    WHERE key = 'features.enableCovidClearanceCertificate'
    `,
  );

  /**
   * Have you handled the state of the sync_lookup table after running this migration?
   * You can add the following query to rebuild the lookup table for the tables you have modified:
   */
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('settings');`);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `
    UPDATE settings
    SET key = 'features.enableCovidClearanceCertificate'
    WHERE key = 'features.covidCertificates.enableCovidClearanceCertificate'
    `,
  );
  await query.sequelize.query(`SELECT flag_lookup_model_to_rebuild('settings');`);
}
