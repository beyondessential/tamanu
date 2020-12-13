import { initDatabase } from 'sync-server/app/database';
import { deleteTestData } from './setupUtilities';

export default async function() {
  const ctx = initDatabase({
    testMode: true,
  });

  await deleteTestData(ctx);

  // mongo connection needs to be closed for test suite to terminate correctly
  if (ctx.store.close) {
    await ctx.store.close();
  }
}
