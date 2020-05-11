import { initDatabase } from 'lan/app/database';
import { deleteAllTestIds } from './setupUtilities';

export default async function() {
  const ctx = initDatabase({
    testMode: true,
  });
  await deleteAllTestIds(ctx);
}
