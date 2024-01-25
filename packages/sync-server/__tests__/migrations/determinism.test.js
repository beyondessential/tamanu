import { createMigrationInterface, runPostMigration } from '@tamanu/shared/services/migrations';
import { log } from '@tamanu/shared/services/logging';
import {
  initQueryCollectingDb,
  collectInfoForMigrations,
  resetToMigration,
  getHashesForTables,
  isMigrationIgnored,
} from './helpers';
import { regenerateData, generateData } from './data';

const EARLIEST_MIGRATION_TO_CHECK = '1688259204459-addFhirTriggersForNotesTable.js';

describe('deterministic migrations', () => {
  let db, migrationsInfo, umzug, fakeData;
  beforeAll(async () => {
    const qc = await initQueryCollectingDb();
    const { flushQueries } = qc;
    db = qc.db;

    // collect info about which migrations touch which tables
    umzug = createMigrationInterface(log, db.sequelize);
    migrationsInfo = await collectInfoForMigrations(
      umzug,
      flushQueries,
      EARLIEST_MIGRATION_TO_CHECK,
    );
    await runPostMigration(log, db.sequelize); // necessary for data to be generated
    fakeData = await generateData(db.sequelize.models); // populates tables that will be migrated
  });

  it('produces identical data when run', async () => {
    for (const { name, upTables, downTables } of migrationsInfo) {
      if (isMigrationIgnored(name)) continue;

      if (downTables.length === 0) {
        // Note that Jest doesn't print warnings by default for passed tests.
        console.warn(`${name} is not tested for non-determinism since the down migration is empty`);
      }

      // collect hash info
      await resetToMigration(umzug, name);
      await runPostMigration(log, db.sequelize); // necessary for data to be generated
      await regenerateData(name, fakeData, db.sequelize.models);
      let hashes1 = await getHashesForTables(db.sequelize, upTables);

      await umzug.down({ migrations: [name] });
      await umzug.up({ migrations: [name] });

      await runPostMigration(log, db.sequelize); // necessary for data to be generated
      await regenerateData(name, fakeData, db.sequelize.models);
      let hashes2 = await getHashesForTables(db.sequelize, upTables);

      // compare
      try {
        expect(hashes1).toEqual(hashes2);
      } catch (e) {
        throw new Error(`${e.message}\nMigration name=${name}`);
      }
    }
  });
});
