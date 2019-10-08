import config from 'config';
import { schemas, version as schemaVersion } from 'Shared/schemas';
import { Database } from './database';
import { Listeners } from './listeners';

export function setupDatabase() {
  // Set up database
  const database = new Database({
    path: `./data/${config.db.name}.realm`,
    schema: schemas,
    schemaVersion,
  });

  // Set up database sync
  const listeners = new Listeners(database);
  listeners.addDatabaseListeners();

  return database;
}
