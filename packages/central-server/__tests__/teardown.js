import { closeDatabase } from '@tamanu/central-server/app/database';

export default async function() {
  await closeDatabase();
}
