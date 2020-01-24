import config from 'config';
import { schemas, version as schemaVersion } from 'shared/schemas';
import { Database } from './database';

export function setupDatabase() {
  // Set up database
  const database = new Database({
    path: `./data/${config.db.name}.realm`,
    schema: schemas,
    schemaVersion,
  });

  return database;
}
