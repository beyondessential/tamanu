import { Sequelize } from 'sequelize';
import config from 'config';

import * as models from 'Shared/models';

export async function initDatabase() {
  // connect to database
  const sequelize = new Sequelize(
    config.db.name, 
    config.db.username,
    config.db.password,
    {
      dialect: 'sqlite',
      storage: 'data/test.db',
    }
  );

  // init all models
  const modelClasses = Object.entries(models);
  await Promise.all(modelClasses.map(([name, cls]) => {
    console.log(`Registered ${name}`);
    cls.init({
      underscored: true,
      sequelize
    }, models);
  }));
  await Promise.all(modelClasses.map(([name, cls]) => {
    if(cls.initRelations) {
      console.log(`Adding relations for ${name}`);
      cls.initRelations(models);
    }
  }));

  // perform migrations
  console.log(`Syncing database...`);
  await sequelize.sync();

  return { sequelize, models };
}
