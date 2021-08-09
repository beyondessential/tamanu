import { Sequelize } from 'sequelize';
import { createNamespace } from 'cls-hooked';
import pg from 'pg';
import wayfarer from 'wayfarer';

// an issue in how webpack's require handling interacts with sequelize means we need
// to provide the module to sequelize manually
// issue & resolution here: https://github.com/sequelize/sequelize/issues/9489#issuecomment-486047783
import sqlite3 from 'sqlite3';

import { log } from './logging';

import { migrateUp, migrateDown } from './migrations';
import * as models from '../models';
import { initSyncClientModeHooks } from '../models/sync';

// this is dangerous and should only be used in test mode
const unsafeRecreatePgDb = async ({ name, username, password, host, port }) => {
  const client = new pg.Client({
    user: username,
    password,
    host,
    port,
    // 'postgres' is the default database that's automatically
    // created on new installs - we just need something to connect
    // to, and it doesn't matter what the schema is!
    database: 'postgres',
  });
  try {
    await client.connect();
    await client.query(`DROP DATABASE IF EXISTS "${name}"`);
    await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }
};

async function connectToDatabase(dbOptions) {
  // connect to database
  const {
    username,
    password,
    testMode = false,
    host = null,
    port = null,
    verbose = false,
    makeEveryModelParanoid = false,
    saltRounds = null,
    primaryKeyDefault = Sequelize.UUIDV4,
    hackToSkipEncounterValidation = false, // TODO: remove once mobile implements all relationships
    syncClientMode = false,
  } = dbOptions;
  let { name, sqlitePath = null } = dbOptions;

  // configure one test db per jest worker
  const workerId = process.env.JEST_WORKER_ID;
  if (testMode && workerId) {
    if (sqlitePath) {
      const sections = sqlitePath.split('.');
      const extension = sections[sections.length - 1];
      const rest = sections.slice(0, -1).join('.');
      sqlitePath = `${rest}-${workerId}.${extension}`;
    } else {
      name = `${name}-${workerId}`;
      await unsafeRecreatePgDb({ ...dbOptions, name });
    }
  }

  if (sqlitePath) {
    log.info(`Connecting to sqlite database at ${sqlitePath}...`);
  } else {
    log.info(`Connecting to database ${username}@${name}...`);
  }

  // this allows us to use transaction callbacks without manually managing a transaction handle
  // https://sequelize.org/master/manual/transactions.html#automatically-pass-transactions-to-all-queries
  const namespace = createNamespace('sequelize-transaction-namespace');
  Sequelize.useCLS(namespace);

  const logging = verbose ? s => log.debug(s) : null;
  const options = sqlitePath
    ? { dialect: 'sqlite', dialectModule: sqlite3, storage: sqlitePath }
    : { dialect: 'postgres' };
  const sequelize = new Sequelize(name, username, password, {
    ...options,
    host,
    port,
    logging,
  });

  return sequelize;
}

export async function initDatabase(dbOptions) {
  const sequelize = await connectToDatabase(dbOptions);

  /*
  // Ideally we could trigger a down-migration via something like
  // $ yarn run lan-start-dev --migrate-down
  // But the usual interface is going through package.json and webpack
  // so it's a bit of a pain. This approach lets us do:
  // $ MIGRATE_DOWN=true yarn run lan-start-dev
  // which is pretty close.
  if (process.env.MIGRATE_DOWN) {
    await migrateDown(log, sequelize);
    process.exit(0);
  }

  // attach migration function to the sequelize object - leaving the responsibility
  // of calling it to the implementing server (this allows for skipping migrations
  // in favour of calling sequelize.sync() during test mode)
  sequelize.migrate = sqlitePath
    ? sequelize.sync // just sync in sqlite mode, migrations may contain pg-specific sql
    : () => migrateUp(log, sequelize);
  */

  const {
    saltRounds,
    primaryKeyDefault,
    makeEveryModelParanoid,
    hackToSkipEncounterValidation,
    syncClientMode,
  } = dbOptions;

  // set configuration variables for individual models
  models.User.SALT_ROUNDS = saltRounds;

  // init all models
  const modelClasses = Object.values(models);
  const primaryKey = {
    type: Sequelize.STRING,
    defaultValue: primaryKeyDefault,
    allowNull: false,
    primaryKey: true,
  };
  log.info(`Registering ${modelClasses.length} models...`);
  modelClasses.forEach(modelClass => {
    modelClass.init(
      {
        underscored: true,
        primaryKey,
        sequelize,
        paranoid: makeEveryModelParanoid,
        hackToSkipEncounterValidation,
        syncClientMode,
      },
      models,
    );
  });

  modelClasses.forEach(modelClass => {
    if (modelClass.initRelations) {
      modelClass.initRelations(models);
    }
  });

  // init global sync hooks that live in shared-src
  if (syncClientMode) {
    initSyncClientModeHooks(models);
  }

  // router to convert channelRoutes (e.g. `[patient/:patientId/issue]`) to a model + params
  // (e.g. PatientIssue + { patientId: 'abc123', route: '...' })
  sequelize.channelRouter = wayfarer();
  for (const model of modelClasses) {
    /*
     * add channel route to channelRouter
     *
     *   a channel route: `patient/:patientId/foobar`
     *   a channel:       `patient/1234abcd/foobar`
     */
    for (const channelRoute of model.syncConfig.channelRoutes) {
      sequelize.channelRouter.on(channelRoute.route, (params, f) => f(model, params, channelRoute));
    }

    // run afterInit callbacks for model
    await Promise.all(model.afterInitCallbacks.map(fn => fn()));
  }

  return { sequelize, models };
}
