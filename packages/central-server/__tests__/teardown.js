import { closeDatabase } from '../app/database';

export default async function() {
  await closeDatabase();
}
