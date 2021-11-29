import { initDatabase } from '../app/database';

export async function migrate(options) {
  const store = await initDatabase({ testMode: false });
  await store.sequelize.migrate(options);
  process.exit(0);
}
