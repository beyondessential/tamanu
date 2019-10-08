import { setupDatabase } from './app/database';
import { createApp } from './createApp';

const database = setupDatabase();
createApp(database);
