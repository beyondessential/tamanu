const DEFAULT_SETTINGS = {
  'fhir.enabled': true,
  'fhir.queue.enabled': true,
  'fhir.queue.timeout': '10 minutes',
  'fhir.queue.maxConcurrency': 100,
};

export async function up(query) {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await query.sequelize.query(`
      INSERT INTO settings (key, value)
      VALUES ('${key}', '${JSON.stringify(value)}')
      ON CONFLICT (key) WHERE deleted_at IS NULL DO NOTHING
    `);
  }
}

export async function down() {
  // these apply defaults to the settings table,
  // so we can't undo them without potentially losing data
}
