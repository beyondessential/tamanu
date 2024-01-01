import { closeDatabase } from '../dist/database';

export default async function() {
  await closeDatabase();
}
