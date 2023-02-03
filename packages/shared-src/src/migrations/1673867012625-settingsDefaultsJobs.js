import config from 'config';

const DEFAULT_SETTINGS = {
  'jobs.worker.hearbeat': '1 minute',
  'jobs.worker.assumeDroppedAfter': '10 minutes',
  'jobs.topics.default.schedule': '* * * * *', // once a minute
  'jobs.topics.default.maxConcurrency': 10,
};

export async function up(query) {
  // only write defaults to central
  if (config?.serverFacilityId) return;

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await query.sequelize.query(`
      INSERT INTO settings (key, value)
      VALUES ('${key}', '${JSON.stringify(value)}')
      ON CONFLICT (key, facility_id, deleted_at)
        WHERE facility_id IS NULL AND deleted_at IS NULL
          DO NOTHING
    `);
  }
}

export async function down() {
  // these apply defaults to the settings table,
  // so we can't undo them without potentially losing data
}
