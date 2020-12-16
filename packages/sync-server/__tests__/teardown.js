import { initDatabase, closeDatabase } from 'sync-server/app/database';
import { deleteTestData } from './setupUtilities';

export default async function() {
  const ctx = initDatabase({
    testMode: true,
  });

  await deleteTestData(ctx);
  await closeDatabase();
}
