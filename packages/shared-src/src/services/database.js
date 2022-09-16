import { Sequelize } from 'sequelize';
import { createNamespace } from 'cls-hooked';
import pg from 'pg';
import util from 'util';

// an issue in how webpack's require handling interacts with sequelize means we need
// to provide the module to sequelize manually
// issue & resolution here: https://github.com/sequelize/sequelize/issues/9489#issuecomment-486047783
import sqlite3 from 'sqlite3';

import { log } from './logging';

import { migrate, assertUpToDate } from './migrations';
import * as models from '../models';
import { createDateTypes } from './createDateTypes';

createDateTypes();

// this allows us to use transaction callbacks without manually managing a transaction handle
// https://sequelize.org/master/manual/transactions.html#automatically-pass-transactions-to-all-queries
// done once for all sequelize objects
const namespace = createNamespace('sequelize-transaction-namespace');
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
    log.info(
      `Connecting to database ${username || '<no username>'}:*****@${host || '<no host>'}:${port ||
        '<no port>'}/${name || '<no name>'}...`,
    );
  }

  const logging = verbose
    ? (query, obj) =>
        log.debug(
          `${util.inspect(query)}; -- ${util.inspect(obj.bind || [], { breakLength: Infinity })}`,
        )
    : null;
  const options = sqlitePath
    ? { dialect: 'sqlite', dialectModule: sqlite3, storage: sqlitePath }
    : { dialect: 'postgres' };
  const sequelize = new Sequelize(name, username, password, {
    ...options,
    host,
    port,
    logging,
  });
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
    makeEveryModelParanoid = false,
    saltRounds = null,
    primaryKeyDefault = Sequelize.UUIDV4,
    hackToSkipEncounterValidation = false, // TODO: remove once mobile implements all relationships
    sqlitePath,
  } = dbOptions;

  const sequelize = await connectToDatabase(dbOptions);

  // set configuration variables for individual models
  models.User.SALT_ROUNDS = saltRounds;

  // attach migration function to the sequelize object - leaving the responsibility
  // of calling it to the implementing server (this allows for skipping migrations
  // in favour of calling sequelize.sync() during test mode)
  sequelize.migrate = async direction => {
    if (sqlitePath) {
      log.info('Syncing sqlite schema...');
      await sequelize.sync({});
      return;
    }

    await migrate(log, sequelize, direction);
  };

  sequelize.assertUpToDate = async options => assertUpToDate(log, sequelize, options);

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
      },
      models,
    );
  });

  modelClasses.forEach(modelClass => {
    if (modelClass.initRelations) {
      modelClass.initRelations(models);
    }
  });

  // add isInsideTransaction helper to avoid exposing the namespace
  sequelize.isInsideTransaction = () => !!namespace.get('transaction');

  return { sequelize, models };
}
