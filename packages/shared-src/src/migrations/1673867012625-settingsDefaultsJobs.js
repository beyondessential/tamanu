const DEFAULT_SETTINGS = {
  'job.worker.hearbeat': '1 minute',
  'job.worker.assumeDroppedAfter': '10 minutes',
  // 'fhir.queue.maxConcurrency': 100,
};

export async function up(query) {
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
