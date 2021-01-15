import { Sequelize } from 'sequelize';
import { createNamespace } from 'cls-hooked';
import * as models from '../models';

// an issue in how webpack's require handling interacts with sequelize means we need
// to provide the module to sequelize manually
// issue & resolution here: https://github.com/sequelize/sequelize/issues/9489#issuecomment-486047783
import sqlite3 from 'sqlite3';

export function initDatabase(dbOptions) {
  // connect to database
  const {
    username,
    password,
    name,
    log,
    host=null,
    port=null,
    verbose=false,
    sqlitePath=null,
    makeEveryModelParanoid=false,
    saltRounds=null,
    primaryKeyDefault=Sequelize.UUIDV4,
    primaryKeyType=Sequelize.UUID,
  } = dbOptions;

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
