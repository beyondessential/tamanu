import { initDatabase, closeDatabase } from 'sync-server/app/database';

export default async function() {
  const ctx = initDatabase({
    testMode: true,
  });
  await ctx.store.sequelize.drop();
  await closeDatabase();
}
