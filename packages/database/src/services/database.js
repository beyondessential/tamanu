import { AsyncLocalStorage } from 'async_hooks';
import { Sequelize } from 'sequelize';
import pg from 'pg';
import util from 'util';

import { SYNC_DIRECTIONS, AUDIT_USERID_KEY, SESSION_CONFIG_PREFIX } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { serviceContext, serviceName } from '@tamanu/shared/services/logging/context';

import { assertUpToDate, migrate, NON_SYNCING_TABLES } from './migrations';
import * as models from '../models';
import { createDateTypes } from './createDateTypes';
import { setupQuote } from '../utils/pgComposite';

createDateTypes();

export const asyncLocalStorage = new AsyncLocalStorage();
// this allows us to use transaction callbacks without manually managing a transaction handle
// https://sequelize.org/master/manual/transactions.html#automatically-pass-transactions-to-all-queries
// done once for all sequelize objects. Instead of cls-hooked we use the built-in AsyncLocalStorage.
export const namespace = {
  bind: () => {}, // compatibility with cls-hooked, not used by sequelize
  get: (id) => asyncLocalStorage.getStore()?.get(id),
  set: (id, value) => asyncLocalStorage.getStore()?.set(id, value),
  run: (callback) => asyncLocalStorage.run(new Map(), callback),
};

export const setSessionConfigInNamespace = (key, value, callback) => {
  namespace.run(() => {
    namespace.set(`${SESSION_CONFIG_PREFIX}${key}`, value);
    callback()
  });
};

export const getSessionConfigInNamespace = (key) => namespace.get(`${SESSION_CONFIG_PREFIX}${key}`);

// eslint-disable-next-line react-hooks/rules-of-hooks
Sequelize.useCLS(namespace);

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
    username,
    password,
    testMode = false,
    host = null,
    port = null,
    verbose = false,
    pool,
    alwaysCreateConnection = true,
    loggingOverride = null, // used in tests for migration determinism
    disableChangesAudit = false,
  } = dbOptions;
  let { name } = dbOptions;

  // configure one test db per jest worker
  const workerId = process.env.JEST_WORKER_ID;
  if (testMode && workerId) {
    name = `${name}-${workerId}`;
    if (alwaysCreateConnection) {
      await unsafeRecreatePgDb({ ...dbOptions, name });
    }
  }

  log.info('databaseConnection', {
    username,
    host,
    port,
    name,
  });

  let logging;
  if (loggingOverride) {
    logging = loggingOverride;
  } else if (verbose) {
    logging = (query, obj) =>
      log.debug('databaseQuery', {
        query: util.inspect(query),
        binding: util.inspect(obj.bind || [], { breakLength: Infinity }),
      });
  } else {
    logging = null;
  }

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

  sequelize.setSessionVar = (key, value) =>
    sequelize.query(`SELECT public.set_session_config($key, $value)`, {
      bind: { key, value },
    });

  sequelize.setTransactionVar = (key, value) =>
    sequelize.query(`SELECT public.set_session_config($key, $value, true)`, {
      bind: { key, value },
    });

  if (!disableChangesAudit) {
    class QueryWithAuditConfig extends sequelize.dialect.Query {
      async run(sql, options) {
        const userid = getSessionConfigInNamespace(AUDIT_USERID_KEY);
        if (userid)
          await super.run(
            'SELECT public.set_session_config($1, $2)',
            [AUDIT_USERID_KEY, userid],
          );
        try {
          return await super.run(sql, options);
        } catch (error) {
          log.error(error);
          throw error;
        }
      }
    }
    sequelize.dialect.Query = QueryWithAuditConfig;
  }

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

export async function initDatabase(dbOptions) {
  // connect to database
  const {
    makeEveryModelParanoid = true,
    saltRounds = null,
    alwaysCreateConnection = true,
    primaryKeyDefault = Sequelize.fn('gen_random_uuid'),
    hackToSkipEncounterValidation = false, // TODO: remove once mobile implements all relationships
  } = dbOptions;

  const sequelize = await connectToDatabase(dbOptions);

  if (!alwaysCreateConnection) {
    return { sequelize };
  }

  // set configuration variables for individual models
  models.User.SALT_ROUNDS = saltRounds;

  // attach migration function to the sequelize object - leaving the responsibility
  // of calling it to the implementing server (this allows for skipping migrations
  // in favour of calling sequelize.sync() during test mode)
  // eslint-disable-next-line require-atomic-updates
  sequelize.migrate = async (direction) => {
    await migrate(log, sequelize, direction);
  };

  sequelize.assertUpToDate = async (options) => assertUpToDate(log, sequelize, options);

  // init all models
  const modelClasses = Object.values(models);
  const primaryKey = {
    type: Sequelize.STRING,
    defaultValue: primaryKeyDefault,
    allowNull: false,
    primaryKey: true,
  };
  log.info('registeringModels', { count: modelClasses.length });
  modelClasses.forEach((modelClass) => {
    if ('initModel' in modelClass) {
      modelClass.initModel(
        {
          underscored: true,
          primaryKey,
          sequelize,
          paranoid: makeEveryModelParanoid,
          hackToSkipEncounterValidation,
        },
        models,
      );
    } else {
      throw new Error(`Model ${modelClass.name} has no initModel()`);
    }
  });

  modelClasses.forEach((modelClass) => {
    if (modelClass.initRelations) {
      modelClass.initRelations(models);
    }
  });

  modelClasses.forEach((modelClass) => {
    if (
      modelClass.syncDirection === SYNC_DIRECTIONS.DO_NOT_SYNC &&
      modelClass.usesPublicSchema &&
      !NON_SYNCING_TABLES.includes(`public.${modelClass.tableName}`)
    ) {
      throw new Error(
        `Any table that does not sync should be added to the "NON_SYNCING_TABLES" list. Please check ${modelClass.tableName}`,
      );
    }
  });

  // add isInsideTransaction helper to avoid exposing the asynclocalstorage
  sequelize.isInsideTransaction = () => !!asyncLocalStorage.getStore();

  return { sequelize, models };
}

// this being a Map and not an object is load-bearing!
// Map.entries() will iterate the whole map even if more entries are inserted
// Object.entries(...) will iterate only the state of the object at the time of the call
// we take advantage of that in closeAllDatabases to ensure we _do_ close everything
export const databaseCollection = new Map();
/**
 *
 * @param {string} key
 * @param {unknown} dbOptions
 * @returns {Promise<{ sequelize: Sequelize; models?: typeof models;}>}
 */
export async function openDatabase(key, dbOptions) {
  if (databaseCollection.has(key)) {
    return databaseCollection.get(key);
  }

  const store = await initDatabase(dbOptions);
  if (databaseCollection.has(key)) {
    throw new Error(`race condition! openDatabase() called for the same key=${key} in parallel`);
  }

  databaseCollection.set(key, store);
  return store;
}

export async function closeAllDatabases() {
  for (const [key, connection] of databaseCollection.entries()) {
    databaseCollection.delete(key);
    await connection.sequelize.close();
  }
}
