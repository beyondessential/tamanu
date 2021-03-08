import Umzug from 'umzug';
import { readdirSync } from 'fs';

export function createMigrationInterface(log, sequelize) {
  // ie, shared/src/migrations
  const migrationsDir = __dirname + '/../migrations';

  // Double check the migrations directory exists (should catch any issues 
  // arising out of build systems omitting the migrations dir, for eg)
  // Note that Umzug will throw if the directory is missing, but won't report
  // errors if the directory is empty - so this is maybe overcautious, but, it's
  // just a few ms on startup, we'll be ok.
  const migrationFiles = readdirSync(migrationsDir);
  if(migrationFiles.length === 0) {
    throw new Error("Could not find migrations");
  }

  const umzug = new Umzug({
    migrations: {
      path: migrationsDir,
      params: [
        sequelize.getQueryInterface(),
      ]
    },
    storage: 'sequelize',
    storageOptions: {
      sequelize,
    }
  });

  return umzug;
}

export async function migrateUp(log, sequelize) {
  const migrations = createMigrationInterface(log, sequelize);

  const pending = await migrations.pending();
  if(pending.length > 0) {
    log.info(`Performing ${pending.length} migrations...`);
    await migrations.up();
  } else {
    log.info('Migrations already up-to-date.');
  }
}

export async function migrateDown(log, sequelize) {
  const migrations = createMigrationInterface(log, sequelize);
  log.info(`Reverting 1 migration...`);
  const reverted = await migrations.down();
  if(Array.isArray(reverted)) {
    if(reverted.length === 0) {
      log.warn(`No migrations to revert.`);
    } else {
      const files = reverted.map(x => x.file);
      log.info(`Reverted ${reverted.length} migrations: ${files.join(', ')}`);
    }
  } else {
    log.info(`Reverted migration ${reverted.file}.`);
  }
}
