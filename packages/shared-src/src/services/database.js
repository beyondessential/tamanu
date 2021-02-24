import { Sequelize } from 'sequelize';
import { createNamespace } from 'cls-hooked';
import pg from 'pg';
import * as models from '../models';

// an issue in how webpack's require handling interacts with sequelize means we need
// to provide the module to sequelize manually
// issue & resolution here: https://github.com/sequelize/sequelize/issues/9489#issuecomment-486047783
import sqlite3 from 'sqlite3';

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
    log.error(`unsafeRecreateDb: ${e.stack}`);
    throw e;
  } finally {
    await client.end();
  }
};

export async function initDatabase(dbOptions) {
  // connect to database
  const {
    username,
    password,
    log,
    testMode=false,
    host=null,
    port=null,
    verbose=false,
    makeEveryModelParanoid=false,
    saltRounds=null,
    primaryKeyDefault=Sequelize.UUIDV4,
    primaryKeyType=Sequelize.UUID,
    hackToSkipEncounterValidation=false, // TODO: remove once mobile implements all relationships
  } = dbOptions;
  let {
    name,
    sqlitePath=null,
  } = dbOptions;

  // configure one test db per jest worker
  const workerId = process.env.JEST_WORKER_ID
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

  // set configuration variables for individual models
  models.User.SALT_ROUNDS = saltRounds;

  // init all models
  const modelClasses = Object.values(models);
  const primaryKey = {
    type: primaryKeyType,
    defaultValue: primaryKeyDefault,
    allowNull: false,
    primaryKey: true,
  };
  log.info(`Registering ${modelClasses.length} models...`);
  modelClasses.map(modelClass => {
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

  modelClasses.map(modelClass => {
    if (modelClass.initRelations) {
      modelClass.initRelations(models);
    }
  });

  return { sequelize, models };
}
