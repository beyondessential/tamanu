import { AsyncLocalStorage } from 'async_hooks';
import { Sequelize } from 'sequelize';
import pg from 'pg';
import util from 'util';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { log } from './logging';
import { serviceContext, serviceName } from './logging/context';

import { migrate, assertUpToDate, NON_SYNCING_TABLES } from './migrations';
import * as models from '../models';
import { createDateTypes } from './createDateTypes';
import { setupQuote } from '../utils/pgComposite';

createDateTypes();

// this allows us to use transaction callbacks without manually managing a transaction handle
// https://sequelize.org/master/manual/transactions.html#automatically-pass-transactions-to-all-queries
// done once for all sequelize objects. Instead of cls-hooked we use the built-in AsyncLocalStorage.
const asyncLocalStorage = new AsyncLocalStorage();
// eslint-disable-next-line react-hooks/rules-of-hooks
Sequelize.useCLS({
  bind: () => {}, // compatibility with cls-hooked, not used by sequelize
  get: id => asyncLocalStorage.getStore()?.get(id),
  set: (id, value) => asyncLocalStorage.getStore()?.set(id, value),
  run: callback => asyncLocalStorage.run(new Map(), callback),
});

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
  } catch (e) {
    log.error(
      'Failed to drop database. Note that every createTestContext() must have a corresponding ctx.close()!',
    );
    throw e;
  } finally {
    await client.end();
  }
};

async function connectToDatabase(dbOptions) {
  // connect to database
  const {
    testMode = false,
    host = null,
    port = null,
    verbose = false,
    pool,
    username,
    password,
  } = dbOptions;
  let { name } = dbOptions;

  // configure one test db per jest worker
  const workerId = process.env.JEST_WORKER_ID;
  if (testMode && workerId) {
    name = `${name}-${workerId}`;
    await unsafeRecreatePgDb({ ...dbOptions, name });
  }

  log.info('databaseConnection', {
    username,
    host,
    port,
    name,
  });

  const logging = verbose
    ? (query, obj) =>
        log.debug('databaseQuery', {
          query: util.inspect(query),
          binding: util.inspect(obj.bind || [], { breakLength: Infinity }),
        })
    : null;

  const options = {
    dialect: 'postgres',
    dialectOptions: { application_name: serviceName(serviceContext()) ?? 'tamanu' },
  };

  const sequelize = new Sequelize(name, username, password, {
    ...options,
    host,
    port,
    logging,
    pool,
  });
  setupQuote(sequelize);
  await sequelize.authenticate();

  if (!testMode) {
    // in test mode the context is closed manually, and we spin up lots of database
    // connections, so this is just holding onto the sequelize instance in a callback
    // that never gets called.
    process.once('SIGTERM', () => {
      log.info('Received SIGTERM, closing sequelize');
      sequelize.close();
    });
  }

  return sequelize;
}

export async function initReportingInstances(dbOptions, reportOptions) {
  const { pool, credentials } = reportOptions;
  // instantiate reporting instances
  return Object.entries(credentials).reduce(
    async (accPromise, [roleType, { username, password }]) => {
      const acc = await accPromise;
      if (!username || !password) {
        log.warn(`No credentials provided for ${roleType} reporting, skipping...`);
        return acc;
      }
      return {
        ...acc,
        [roleType]: await connectToDatabase({ ...dbOptions, username, password, pool }),
      };
    },
    Promise.resolve({}),
  );
}

export async function initDatabase(dbOptions) {
  // connect to database
  const {
    makeEveryModelParanoid = false,
    enableReportInstances = false,
    saltRounds = null,
    primaryKeyDefault = Sequelize.UUIDV4,
    hackToSkipEncounterValidation = false, // TODO: remove once mobile implements all relationships
    reports,
  } = dbOptions;

  const sequelize = await connectToDatabase(dbOptions);

  const reporting = enableReportInstances && (await initReportingInstances(dbOptions, reports));
  // set configuration variables for individual models
  models.User.SALT_ROUNDS = saltRounds;

  // attach migration function to the sequelize object - leaving the responsibility
  // of calling it to the implementing server (this allows for skipping migrations
  // in favour of calling sequelize.sync() during test mode)
  sequelize.migrate = async direction => {
    await migrate(log, sequelize, direction);
  };

  sequelize.assertUpToDate = async seqOptions => assertUpToDate(log, sequelize, seqOptions);

  // init all models
  const modelClasses = Object.values(models);
  const primaryKey = {
    type: Sequelize.STRING,
    defaultValue: primaryKeyDefault,
    allowNull: false,
    primaryKey: true,
  };
  log.info('registeringModels', { count: modelClasses.length });
  modelClasses.forEach(modelClass => {
    modelClass.init(
      {
        underscored: true,
        primaryKey,
        sequelize,
        paranoid: makeEveryModelParanoid,
        hackToSkipEncounterValidation,
      },
      models,
    );
  });

  modelClasses.forEach(modelClass => {
    if (modelClass.initRelations) {
      modelClass.initRelations(models);
    }
  });

  modelClasses.forEach(modelClass => {
    if (
      modelClass.syncDirection === SYNC_DIRECTIONS.DO_NOT_SYNC &&
      modelClass.usesPublicSchema &&
      !NON_SYNCING_TABLES.includes(modelClass.tableName)
    ) {
      throw new Error(
        `Any table that does not sync should be added to the "NON_SYNCING_TABLES" list. Please check ${modelClass.tableName}`,
      );
    }
  });

  // add isInsideTransaction helper to avoid exposing the asynclocalstorage
  sequelize.isInsideTransaction = () => !!asyncLocalStorage.getStore();

  return { sequelize, reporting, models };
}
