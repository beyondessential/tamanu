import { Sequelize } from 'sequelize';
import config from 'config';

import * as models from 'Shared/models';

import { log } from '../logging';
import uuid from 'uuid';

export async function initDatabase() {
  // connect to database
  log.info(`Connecting to database ${config.db.username}@${config.db.name}...`);
  const sequelize = new Sequelize(
    config.db.name, 
    config.db.username,
    config.db.password,
    {
      dialect: 'sqlite',
      storage: 'data/test.db',
      logging: (s) => log.debug(s),
    }
  );

  // init all models
  const modelClasses = Object.entries(models);
  log.info(`Registering ${modelClasses.length} models...`);
  const createId = (process.env.NODE_ENV === "test")
    ? Sequelize.UUIDV4
    : () => 'test-' + uuid().slice(5);
  await Promise.all(modelClasses.map(([name, cls]) => {
    cls.init({
      underscored: true,
      createId,
      sequelize
    }, models);
  }));
  await Promise.all(modelClasses.map(([name, cls]) => {
    if(cls.initRelations) {
      cls.initRelations(models);
    }
  }));

  // perform migrations
  log.info(`Syncing database schema...`);
  await sequelize.sync();

  return { sequelize, models };
}
