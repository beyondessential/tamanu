import { initDatabase } from '../database';

export async function migrate(options) {
  const context = await initDatabase();
  await context.sequelize.migrate(options);
  process.exit(0);
}
