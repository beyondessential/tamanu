import config from 'config';
import { QueryTypes } from 'sequelize';

const DEFAULT_SETTINGS = {
  'fhir.worker.heartbeat': '1 minute',
  'fhir.worker.assumeDroppedAfter': '10 minutes',
};

export async function up(query) {
  // only write defaults to central
  if (config?.serverFacilityId) return;

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const [{ count }] = await query.sequelize.query(
      'SELECT count(*) FROM settings WHERE key = $key AND facility_id IS NULL AND deleted_at IS NULL',
      {
        bind: { key },
        type: QueryTypes.SELECT,
      },
    );
    if (count > 0) continue;

    await query.sequelize.query('INSERT INTO settings (key, value) VALUES ($key, $value)', {
      bind: {
        key,
        value: JSON.stringify(value),
      },
    });
  }
}

export async function down() {
  // these apply defaults to the settings table,
  // so we can't undo them without potentially losing data
}
