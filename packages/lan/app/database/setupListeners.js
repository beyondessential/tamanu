import { Listeners } from './listeners';

export function setupListeners(database) {
  // Set up database sync
  const listeners = new Listeners(database);
  listeners.addDatabaseListeners();
  return listeners;
}
