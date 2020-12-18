import { closeDatabase } from 'sync-server/app/database';

export default async function() {
  await closeDatabase();
}
