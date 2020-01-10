import { Sequelize } from 'sequelize';
import config from 'config';

import * as models from 'Shared/models';

import { log } from '../logging';

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
      logging: false,
    }
  );

  // init all models
  const modelClasses = Object.entries(models);
  log.info(`Registering ${modelClasses.length} models...`);
  await Promise.all(modelClasses.map(([name, cls]) => {
    cls.init({
      underscored: true,
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
